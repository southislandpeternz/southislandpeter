#!/usr/bin/env python3
"""
Scan NZ-Travel-photos and build Website-Photos / Xiaohongshu-Photos libraries.
Copy-only — never deletes or moves originals.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import shutil
import sys
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import REGIONS, nearest_region  # noqa: E402
from exif_gps import read_gps  # noqa: E402
from library_paths import discover_photo_root  # noqa: E402
from vision import REGION_SCORERS, _load_thumb, _stats  # noqa: E402

REPO_ROOT = SCRIPT_DIR.parents[1]

OUTPUT_DIRS = {
    "Photo-Review",
    "Website-Photos",
    "Xiaohongshu-Photos",
    "小红书素材库",
    "_reports",
    ".git",
}

IMAGE_EXT = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
    ".tif", ".tiff", ".gif", ".avif",
}

LOCATIONS: Dict[str, str] = {
    "mount-cook": "Mount-Cook",
    "lake-tekapo": "Lake-Tekapo",
    "queenstown": "Queenstown",
    "wanaka": "Wanaka",
    "kaikoura": "Kaikoura",
    "milford-sound": "Milford-Sound",
    "christchurch": "Christchurch",
    "akaroa": "Akaroa",
    "castle-hill": "Castle-Hill",
    "west-coast": "West-Coast",
}
UNKNOWN_FOLDER = "Unknown-Location"

FOLDER_HINTS: Dict[str, Tuple[str, ...]] = {
    "mount-cook": ("mount-cook", "mount cook", "mt-cook", "mtcook", "aoraki", "库克山", "hooker", "tasman"),
    "lake-tekapo": ("lake-tekapo", "lake tekapo", "tekapo", "特卡波", "蒂卡波", "good shepherd", "lupin"),
    "queenstown": ("queenstown", "皇后镇", "wakatipu", "remarkables", "gondola"),
    "wanaka": ("wanaka", "瓦纳卡", "roys peak"),
    "kaikoura": ("kaikoura", "凯库拉", "whale", "观鲸", "seal"),
    "milford-sound": ("milford", "fiordland", "米尔福德", "米佛", "mitre peak", "sound"),
    "christchurch": ("christchurch", "基督城", "chc", "cathedral", "botanic"),
    "akaroa": ("akaroa", "阿卡罗阿", "alpaca", "羊驼"),
    "castle-hill": ("castle-hill", "castle hill", "castlehill", "城堡山"),
    "west-coast": ("west-coast", "west coast", "西海岸", "punakaiki", "pancake", "hokitika", "franz", "fox glacier"),
}

BLUR_THRESHOLD = 80.0
LOW_RES_LONG_EDGE = 1200
LOW_RES_MP = 1.0
EXPOSURE_DARK = 0.42
EXPOSURE_BRIGHT = 0.38
EXPOSURE_MEAN_LOW = 35
EXPOSURE_MEAN_HIGH = 220
DHASH_SIMILAR = 10

RATING_LABELS = {
    5: "★★★★★ 网站首页级别",
    4: "★★★★ 景点页面级别",
    3: "★★★ 普通素材",
    2: "★★ 不建议使用",
    1: "★ 删除候选",
}

WEBSITE_PER_LOCATION = 10
XHS_PER_LOCATION = 20


@dataclass
class PhotoRecord:
    path: str
    rel_path: str
    filename: str
    width: int = 0
    height: int = 0
    md5: str = ""
    dhash: str = ""
    lap_var: float = 0.0
    mean_brightness: float = 0.0
    dark_ratio: float = 0.0
    bright_ratio: float = 0.0
    saturation: float = 0.0
    location_id: str = "unknown"
    location_folder: str = UNKNOWN_FOLDER
    location_method: str = ""
    rating: int = 3
    rating_label: str = RATING_LABELS[3]
    score: float = 0.0
    website_score: float = 0.0
    xhs_score: float = 0.0
    category: str = "scenery"
    reason: str = ""
    issues: List[str] = field(default_factory=list)
    duplicate_of: str = ""
    similar_group: str = ""


def repo_root() -> Path:
    return REPO_ROOT


def is_under_output(path: Path, root: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    parts = {p.lower() for p in rel.parts}
    for name in OUTPUT_DIRS:
        if name.lower() in parts:
            return True
    return False


def collect_images(root: Path) -> List[Path]:
    images: List[Path] = []
    for path in root.rglob("*"):
        if not path.is_file() or path.name.startswith("."):
            continue
        if path.suffix.lower() not in IMAGE_EXT:
            continue
        if is_under_output(path, root):
            continue
        images.append(path)
    images.sort(key=lambda p: str(p).lower())
    return images


def md5_file(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def hamming(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def dhash_gray(gray, size: int = 12) -> str:
    import cv2

    img = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA)
    diff = img[:, 1:] > img[:, :-1]
    return "".join("1" if v else "0" for v in diff.flatten())


def classify_from_path(path: Path, root: Path) -> Tuple[str, str]:
    text = " ".join(path.relative_to(root).parts).lower()
    name = path.stem.lower()
    combined = f"{text} {name}"
    best_id = "unknown"
    best_len = 0
    for loc_id, hints in FOLDER_HINTS.items():
        for hint in hints:
            if hint in combined and len(hint) > best_len:
                best_id = loc_id
                best_len = len(hint)
    if best_id != "unknown":
        return best_id, "folder"
    return "unknown", ""


def classify_gps(path: Path) -> Tuple[str, str]:
    coords = read_gps(path)
    if not coords:
        return "unknown", ""
    lat, lon = coords
    match = nearest_region(lat, lon)
    if not match:
        return "unknown", ""
    region_id, score = match
    if region_id in LOCATIONS and score >= 0.45:
        return region_id, f"gps({score:.2f})"
    return "unknown", ""


def vision_region_scores(path: Path) -> Dict[str, float]:
    img = _load_thumb(path)
    if img is None:
        return {}
    s = _stats(img)
    scores: Dict[str, float] = {}
    for rid in LOCATIONS:
        fn = REGION_SCORERS.get(rid)
        if fn:
            sc = fn(s, img)
            if sc > 0:
                scores[rid] = sc
    return scores


def classify_location(path: Path, root: Path) -> Tuple[str, str, str]:
    loc_id, method = classify_from_path(path, root)
    if loc_id != "unknown":
        return loc_id, LOCATIONS.get(loc_id, UNKNOWN_FOLDER), method

    loc_id, method = classify_gps(path)
    if loc_id != "unknown":
        return loc_id, LOCATIONS[loc_id], method

    scores = vision_region_scores(path)
    if scores:
        best = max(scores.items(), key=lambda x: x[1])
        if best[1] >= 0.42:
            return best[0], LOCATIONS[best[0]], f"vision({best[1]:.2f})"

    return "unknown", UNKNOWN_FOLDER, "unclassified"


def is_commercial_unsuitable(issues: List[str], lap_var: float, w: int, h: int) -> bool:
    flags = set(issues)
    if "text_screenshot" in flags or "png_screenshot" in flags:
        return True
    if "blurred" in flags and lap_var < 50:
        return True
    if "low_resolution" in flags and "blurred" in flags:
        return True
    if min(w, h) < 400:
        return True
    return False


def detect_screenshot_issues(path: Path, gray, w: int, h: int) -> List[str]:
    issues: List[str] = []
    name = path.name.lower()
    if re.search(r"(screenshot|截屏|截图|wechat|微信|chat|review|评价|flight|航班)", name):
        issues.append("text_screenshot")
    if path.suffix.lower() == ".png":
        issues.append("png_screenshot")
    ar = w / h if h else 1
    light = float((gray > 200).mean())
    if 1.65 < (h / max(w, 1)) < 2.4 and light > 0.45:
        issues.append("phone_screenshot")
    return issues


def compute_scores(
    lap_var: float,
    mean_b: float,
    dark: float,
    bright: float,
    sat: float,
    w: int,
    h: int,
    vision_max: float,
    issues: List[str],
) -> Tuple[float, float, float, int, str]:
    long_edge = max(w, h)
    mp = (w * h) / 1e6
    ar = w / h if h else 1

    sharp = min(1.0, lap_var / 400.0)
    exposure = 1.0
    if dark >= EXPOSURE_DARK or mean_b < EXPOSURE_MEAN_LOW:
        exposure -= 0.35
    if bright >= EXPOSURE_BRIGHT or mean_b > EXPOSURE_MEAN_HIGH:
        exposure -= 0.35
    exposure = max(0.0, exposure)

    color = min(1.0, sat * 1.8 + 0.15)
    res = min(1.0, long_edge / 3000.0) * min(1.0, mp / 8.0)
    comp = min(1.0, 0.55 + vision_max * 0.45)
    tourism = min(1.0, vision_max * 0.7 + sharp * 0.3)

    penalty = 0.0
    if "blurred" in issues:
        penalty += 0.25
    if "underexposed" in issues:
        penalty += 0.15
    if "overexposed" in issues:
        penalty += 0.15
    if "low_resolution" in issues:
        penalty += 0.2
    if any(x in issues for x in ("text_screenshot", "png_screenshot", "phone_screenshot")):
        penalty += 0.5

    base = (
        sharp * 22
        + exposure * 18
        + color * 16
        + res * 14
        + comp * 12
        + tourism * 18
    ) - penalty * 30

    website = base + (8 if ar >= 1.15 else 0) + res * 10 + sharp * 8
    xhs = base + color * 12 + sharp * 6 + (6 if sat > 0.35 else 0)

    score = max(0.0, min(100.0, base))
    if score >= 82 and sharp >= 0.55 and penalty < 0.2:
        rating = 5
    elif score >= 68 and sharp >= 0.4 and penalty < 0.35:
        rating = 4
    elif score >= 52 and penalty < 0.5:
        rating = 3
    elif score >= 38:
        rating = 2
    else:
        rating = 1

    reasons = []
    if rating >= 5:
        reasons.append("高清晰度+强旅游吸引力")
    elif rating >= 4:
        reasons.append("适合景点页面展示")
    elif rating >= 3:
        reasons.append("可用素材")
    elif rating >= 2:
        reasons.append("质量或构图一般")
    else:
        reasons.append("模糊/曝光/截图等问题")
    if ar >= 1.2:
        reasons.append("横版")
    if color > 0.55:
        reasons.append("色彩鲜艳")

    return score, website, xhs, rating, "；".join(reasons)


def analyze_one(args: Tuple[str, str]) -> Optional[dict]:
    path_str, root_str = args
    path = Path(path_str)
    root = Path(root_str)
    try:
        import cv2
        import numpy as np

        data = np.fromfile(str(path), dtype=np.uint8)
        bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if bgr is None:
            return None
        h, w = bgr.shape[:2]
        gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_b = float(gray.mean())
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        total = hist.sum() or 1
        dark_ratio = float(hist[:26].sum() / total)
        bright_ratio = float(hist[230:].sum() / total)
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        sat = float(hsv[:, :, 1].mean() / 255.0)
        dh = dhash_gray(gray)
    except Exception:
        return None

    issues: List[str] = []
    if lap_var < BLUR_THRESHOLD:
        issues.append("blurred")
    if dark_ratio >= EXPOSURE_DARK or mean_b < EXPOSURE_MEAN_LOW:
        issues.append("underexposed")
    if bright_ratio >= EXPOSURE_BRIGHT or mean_b > EXPOSURE_MEAN_HIGH:
        issues.append("overexposed")
    long_edge = max(w, h)
    if long_edge < LOW_RES_LONG_EDGE or (w * h) / 1e6 < LOW_RES_MP:
        issues.append("low_resolution")
    issues.extend(detect_screenshot_issues(path, gray, w, h))

    loc_id, loc_folder, loc_method = classify_location(path, root)
    vision_scores = vision_region_scores(path)
    vision_max = max(vision_scores.values()) if vision_scores else 0.0

    if is_commercial_unsuitable(issues, lap_var, w, h):
        issues.append("commercial_unsuitable")

    score, website_score, xhs_score, rating, reason = compute_scores(
        lap_var, mean_b, dark_ratio, bright_ratio, sat, w, h, vision_max, issues
    )

    try:
        digest = md5_file(path)
    except OSError:
        digest = ""

    rel = str(path.relative_to(root))
    rec = PhotoRecord(
        path=str(path),
        rel_path=rel,
        filename=path.name,
        width=w,
        height=h,
        md5=digest,
        dhash=dh,
        lap_var=round(lap_var, 1),
        mean_brightness=round(mean_b, 1),
        dark_ratio=round(dark_ratio, 3),
        bright_ratio=round(bright_ratio, 3),
        saturation=round(sat, 3),
        location_id=loc_id,
        location_folder=loc_folder,
        location_method=loc_method,
        rating=rating,
        rating_label=RATING_LABELS[rating],
        score=round(score, 1),
        website_score=round(website_score, 1),
        xhs_score=round(xhs_score, 1),
        category="scenery" if loc_id != "unknown" else "unknown",
        reason=reason,
        issues=sorted(set(issues)),
    )
    return asdict(rec)


def mark_duplicates(records: List[PhotoRecord]) -> None:
    by_md5: Dict[str, PhotoRecord] = {}
    for rec in records:
        if not rec.md5:
            continue
        if rec.md5 in by_md5:
            keeper = by_md5[rec.md5]
            if rec.score > keeper.score:
                rec, keeper = keeper, rec
            rec.duplicate_of = keeper.rel_path
            if "duplicate_exact" not in rec.issues:
                rec.issues.append("duplicate_exact")
        else:
            by_md5[rec.md5] = rec

    groups: List[List[PhotoRecord]] = []
    assigned: set[int] = set()
    for i, a in enumerate(records):
        if i in assigned or not a.dhash:
            continue
        group = [a]
        assigned.add(i)
        for j, b in enumerate(records):
            if j in assigned or not b.dhash:
                continue
            if hamming(a.dhash, b.dhash) < DHASH_SIMILAR:
                group.append(b)
                assigned.add(j)
        if len(group) > 1:
            groups.append(group)

    for gid, group in enumerate(groups, 1):
        group.sort(key=lambda r: (-r.score, -r.width * r.height))
        leader = group[0]
        tag = f"similar-{gid}"
        leader.similar_group = tag
        for rec in group[1:]:
            rec.similar_group = tag
            if not rec.duplicate_of:
                rec.duplicate_of = leader.rel_path
            if "duplicate_similar" not in rec.issues:
                rec.issues.append("duplicate_similar")


def write_csv(path: Path, rows: List[dict], fieldnames: Sequence[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def safe_copy(src: Path, dest_dir: Path, used_names: set[str]) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = src.name
    stem, suffix = src.stem, src.suffix
    counter = 1
    while name.lower() in used_names:
        name = f"{stem}_{counter}{suffix}"
        counter += 1
    used_names.add(name.lower())
    dest = dest_dir / name
    shutil.copy2(src, dest)
    return dest


def select_and_copy(
    records: List[PhotoRecord],
    root: Path,
    score_key: str,
    per_location: int,
    min_rating: int,
    dest_name: str,
) -> Dict[str, int]:
    counts: Dict[str, int] = defaultdict(int)
    by_loc: Dict[str, List[PhotoRecord]] = defaultdict(list)
    for rec in records:
        if rec.rating < min_rating:
            continue
        if "duplicate_exact" in rec.issues and rec.duplicate_of:
            continue
        by_loc[rec.location_folder].append(rec)

    for folder, items in by_loc.items():
        items.sort(key=lambda r: (-getattr(r, score_key), -r.rating, -r.width * r.height))
        picked: List[PhotoRecord] = []
        seen_dhash: List[str] = []
        for rec in items:
            if len(picked) >= per_location:
                break
            if rec.dhash and any(hamming(rec.dhash, h) < 8 for h in seen_dhash):
                continue
            picked.append(rec)
            if rec.dhash:
                seen_dhash.append(rec.dhash)

        dest_dir = root / dest_name / folder
        used: set[str] = set()
        for rec in picked:
            safe_copy(Path(rec.path), dest_dir, used)
            counts[folder] += 1
    return dict(counts)


def build_report(
    records: List[PhotoRecord],
    website_counts: Dict[str, int],
    xhs_counts: Dict[str, int],
    root: Path,
) -> str:
    lines = [
        "# 旅游素材库筛选报告",
        "",
        f"**生成时间：** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"**素材库路径：** `{root}`",
        "",
        "## 汇总",
        "",
        f"| 指标 | 数量 |",
        f"|------|------|",
        f"| 总照片数量 | {len(records)} |",
        f"| 五星照片 (★★★★★) | {sum(1 for r in records if r.rating == 5)} |",
        f"| 网站精选总数 | {sum(website_counts.values())} |",
        f"| 小红书精选总数 | {sum(xhs_counts.values())} |",
        f"| 删除候选 (★) | {sum(1 for r in records if r.rating == 1)} |",
        "",
        "## 各景点明细",
        "",
    ]

    all_folders = sorted(set(LOCATIONS.values()) | {UNKNOWN_FOLDER})
    by_loc: Dict[str, List[PhotoRecord]] = defaultdict(list)
    for rec in records:
        by_loc[rec.location_folder].append(rec)

    for folder in all_folders:
        items = by_loc.get(folder, [])
        if not items and folder not in website_counts and folder not in xhs_counts:
            continue
        dup = sum(1 for r in items if "duplicate_exact" in r.issues or "duplicate_similar" in r.issues)
        low = sum(1 for r in items if r.rating <= 2 or "commercial_unsuitable" in r.issues)
        five = sum(1 for r in items if r.rating == 5)
        lines.extend([
            f"### {folder}",
            "",
            f"- 照片总数：{len(items)}",
            f"- 五星照片：{five}",
            f"- 网站精选：{website_counts.get(folder, 0)}",
            f"- 小红书精选：{xhs_counts.get(folder, 0)}",
            f"- 低质量/不建议：{low}",
            f"- 重复/相似：{dup}",
            "",
        ])

    return "\n".join(lines) + "\n"


def records_from_dicts(rows: List[dict]) -> List[PhotoRecord]:
    out: List[PhotoRecord] = []
    for row in rows:
        out.append(PhotoRecord(**row))
    return out


def run(root: Path, workers: int = 6) -> None:
    root = root.resolve()
    print(f"Photo library: {root}")
    images = collect_images(root)
    print(f"Found {len(images)} images (excluding output folders)")

    review_dir = root / "Photo-Review"
    review_dir.mkdir(parents=True, exist_ok=True)

    records: List[PhotoRecord] = []
    tasks = [(str(p), str(root)) for p in images]
    done = 0
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(analyze_one, t): t for t in tasks}
        for fut in as_completed(futures):
            done += 1
            if done % 500 == 0 or done == len(tasks):
                print(f"  Analyzed {done}/{len(tasks)}")
            row = fut.result()
            if row:
                records.append(PhotoRecord(**row))

    print(f"Analyzed {len(records)} photos successfully")
    mark_duplicates(records)

    blurred_rows = [
        {"filename": r.filename, "path": r.rel_path, "lap_var": r.lap_var, "issues": "blurred"}
        for r in records if "blurred" in r.issues
    ]
    dup_rows = [
        {
            "filename": r.filename,
            "path": r.rel_path,
            "duplicate_of": r.duplicate_of,
            "similar_group": r.similar_group,
            "type": "exact" if "duplicate_exact" in r.issues else "similar",
        }
        for r in records
        if "duplicate_exact" in r.issues or "duplicate_similar" in r.issues
    ]
    low_rows = [
        {
            "filename": r.filename,
            "path": r.rel_path,
            "issues": ";".join(r.issues),
            "rating": r.rating_label,
            "score": r.score,
        }
        for r in records
        if r.rating <= 2 or "commercial_unsuitable" in r.issues or "low_resolution" in r.issues
    ]

    write_csv(review_dir / "blurred-photos.csv", blurred_rows,
              ["filename", "path", "lap_var", "issues"])
    write_csv(review_dir / "duplicate-photos.csv", dup_rows,
              ["filename", "path", "duplicate_of", "similar_group", "type"])
    write_csv(review_dir / "low-quality-photos.csv", low_rows,
              ["filename", "path", "issues", "rating", "score"])

    rating_rows = [
        {
            "Filename": r.filename,
            "Location": r.location_folder,
            "Rating": r.rating_label,
            "Resolution": f"{r.width}x{r.height}",
            "Category": r.category,
            "Reason": r.reason,
        }
        for r in sorted(records, key=lambda x: (-x.rating, -x.score, x.rel_path))
    ]
    write_csv(root / "photo-rating.csv", rating_rows,
              ["Filename", "Location", "Rating", "Resolution", "Category", "Reason"])

    print("Copying Website-Photos (10 per location)...")
    website_counts = select_and_copy(
        records, root, "website_score", WEBSITE_PER_LOCATION, min_rating=3, dest_name="Website-Photos"
    )
    print("Copying Xiaohongshu-Photos (20 per location)...")
    xhs_counts = select_and_copy(
        records, root, "xhs_score", XHS_PER_LOCATION, min_rating=2, dest_name="Xiaohongshu-Photos"
    )

    report = build_report(records, website_counts, xhs_counts, root)
    (root / "photo-selection-report.md").write_text(report, encoding="utf-8")

    five_star = sum(1 for r in records if r.rating == 5)
    delete_candidates = sum(1 for r in records if r.rating == 1)
    print("\n=== Complete ===")
    print(f"总照片数量: {len(records)}")
    print(f"五星照片数量: {five_star}")
    print(f"网站精选总数: {sum(website_counts.values())}")
    print(f"小红书精选总数: {sum(xhs_counts.values())}")
    print(f"删除候选总数: {delete_candidates}")
    print(f"\nOutputs:")
    print(f"  {root / 'Photo-Review'}")
    print(f"  {root / 'Website-Photos'}")
    print(f"  {root / 'Xiaohongshu-Photos'}")
    print(f"  {root / 'photo-rating.csv'}")
    print(f"  {root / 'photo-selection-report.md'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build website & Xiaohongshu photo libraries (copy only).")
    parser.add_argument("--root", type=Path, help="NZ-Travel-photos root (auto-detect if omitted)")
    parser.add_argument("--workers", type=int, default=6)
    args = parser.parse_args()

    if args.root:
        root = args.root.expanduser().resolve()
    else:
        from inbox_scan import scan_inbox  # noqa: E402

        root = discover_photo_root(repo_root(), scan_inbox)

    if not root.is_dir():
        print(f"Photo root not found: {root}", file=sys.stderr)
        sys.exit(1)

    run(root, workers=args.workers)


if __name__ == "__main__":
    main()
