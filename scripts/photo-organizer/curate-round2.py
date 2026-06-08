#!/usr/bin/env python3
"""
Round-2 curation for Website-Photos and Xiaohongshu-Photos.
Removes duplicate/near-duplicate copies, keeps best commercial shots, renames to SEO slugs.
Only modifies files inside Website-Photos / Xiaohongshu-Photos (copies — originals untouched).
"""
from __future__ import annotations

import argparse
import csv
import re
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from vision import _load_thumb, _stats  # noqa: E402

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heif", ".heic", ".tif", ".tiff"}

WEBSITE_MIN, WEBSITE_MAX = 5, 10
XHS_MIN, XHS_MAX = 10, 20
BURST_HAMMING = 8  # stricter than round 1

LOCATION_META: Dict[str, dict] = {
    "Mount-Cook": {
        "slug": "mount-cook",
        "en": "Mount Cook",
        "zh": "库克山",
        "tags": "#库克山 #新西兰 #雪山 #南岛旅拍",
        "kw": "snow-mountain-alps",
    },
    "Lake-Tekapo": {
        "slug": "lake-tekapo",
        "en": "Lake Tekapo",
        "zh": "特卡波湖",
        "tags": "#特卡波 #蒂卡波湖 #新西兰 #湖景",
        "kw": "turquoise-lake",
    },
    "Queenstown": {
        "slug": "queenstown",
        "en": "Queenstown",
        "zh": "皇后镇",
        "tags": "#皇后镇 #新西兰 #瓦卡蒂普湖",
        "kw": "lake-wakatipu",
    },
    "Wanaka": {
        "slug": "wanaka",
        "en": "Wanaka",
        "zh": "瓦纳卡",
        "tags": "#瓦纳卡 #新西兰 #湖景",
        "kw": "lake-wanaka",
    },
    "Kaikoura": {
        "slug": "kaikoura",
        "en": "Kaikoura",
        "zh": "凯库拉",
        "tags": "#凯库拉 #观鲸 #新西兰 #海岸",
        "kw": "whale-coast",
    },
    "Milford-Sound": {
        "slug": "milford-sound",
        "en": "Milford Sound",
        "zh": "米尔福德峡湾",
        "tags": "#米尔福德峡湾 #峡湾 #新西兰",
        "kw": "fiord-mitre-peak",
    },
    "Christchurch": {
        "slug": "christchurch",
        "en": "Christchurch",
        "zh": "基督城",
        "tags": "#基督城 #新西兰 #城市风光",
        "kw": "city-garden",
    },
    "Akaroa": {
        "slug": "akaroa",
        "en": "Akaroa",
        "zh": "阿卡罗阿",
        "tags": "#阿卡罗阿 #法国小镇 #新西兰",
        "kw": "harbour-village",
    },
    "Castle-Hill": {
        "slug": "castle-hill",
        "en": "Castle Hill",
        "zh": "城堡山",
        "tags": "#城堡山 #新西兰 #石灰岩",
        "kw": "limestone-boulders",
    },
    "West-Coast": {
        "slug": "west-coast",
        "en": "West Coast",
        "zh": "西海岸",
        "tags": "#新西兰西海岸 #冰川 #薄饼岩",
        "kw": "glacier-coast",
    },
    "Unknown-Location": {
        "slug": "south-island",
        "en": "South Island New Zealand",
        "zh": "新西兰南岛",
        "tags": "#新西兰南岛 #旅拍 #风光",
        "kw": "scenic-landscape",
    },
}


@dataclass
class ScoredPhoto:
    path: Path
    dhash: str
    score: float
    website_score: float
    xhs_score: float
    scene_kw: str
    width: int
    height: int


def dhash_gray(gray, size: int = 14) -> str:
    import cv2

    img = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA)
    diff = img[:, 1:] > img[:, :-1]
    return "".join("1" if v else "0" for v in diff.flatten())


def hamming(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def load_cv(path: Path):
    import cv2
    import numpy as np

    data = np.fromfile(str(path), dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    h, w = bgr.shape[:2]
    return bgr, gray, w, h


def scene_keyword(bgr, gray, meta: dict) -> str:
    import cv2

    h, w = gray.shape[:2]
    dark = float((gray < 60).mean())
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean())
    blue = float(((bgr[:, :, 0] > bgr[:, :, 2] + 15) & (bgr[:, :, 0] > bgr[:, :, 1])).mean())
    white = float((gray > 200).mean())

    if dark > 0.45 and white < 0.05:
        return "starry-night"
    if white > 0.25:
        return "snow-peak"
    if blue > 0.18 and sat > 80:
        return "blue-lake"
    if sat > 100:
        return "vivid-landscape"
    return meta.get("kw", "scenic")


def score_photo(path: Path, meta: dict) -> Optional[ScoredPhoto]:
    loaded = load_cv(path)
    if loaded is None:
        return None
    bgr, gray, w, h = loaded
    import cv2

    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    mean_b = float(gray.mean())
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
    total = hist.sum() or 1
    dark = float(hist[:26].sum() / total)
    bright = float(hist[230:].sum() / total)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean() / 255.0)
    ar = w / h if h else 1
    mp = (w * h) / 1e6

    sharp = min(1.0, lap / 450.0)
    exposure = 1.0
    if dark > 0.42 or mean_b < 40:
        exposure -= 0.3
    if bright > 0.38 or mean_b > 215:
        exposure -= 0.3
    exposure = max(0.0, exposure)
    res = min(1.0, max(w, h) / 3200.0) * min(1.0, mp / 10.0)

    base = sharp * 30 + exposure * 22 + res * 18 + sat * 15 + min(1.0, mp / 6) * 10
    website = base + (12 if ar >= 1.2 else 0) + res * 8
    xhs = base + sat * 18 + sharp * 8 + (8 if sat > 0.35 else 0)

    sk = scene_keyword(bgr, gray, meta)
    dh = dhash_gray(gray)
    return ScoredPhoto(path, dh, base, website, xhs, sk, w, h)


def pick_diverse(
    items: List[ScoredPhoto],
    limit_min: int,
    limit_max: int,
    score_key: str,
) -> List[ScoredPhoto]:
    items.sort(key=lambda p: (-getattr(p, score_key), -p.score))
    picked: List[ScoredPhoto] = []
    for item in items:
        if len(picked) >= limit_max:
            break
        if any(hamming(item.dhash, k.dhash) < BURST_HAMMING for k in picked):
            continue
        picked.append(item)
    target = max(limit_min, min(limit_max, len(items)))
    if len(picked) < target:
        for item in items:
            if item in picked:
                continue
            if any(hamming(item.dhash, k.dhash) < 6 for k in picked):
                continue
            picked.append(item)
            if len(picked) >= target:
                break
    return picked[:limit_max]


def seo_filename(meta: dict, scene: str, index: int, ext: str) -> str:
    slug = meta["slug"]
    scene = re.sub(r"[^a-z0-9]+", "-", scene.lower()).strip("-")
    return f"{slug}-{scene}-new-zealand-{index:02d}{ext.lower()}"


def alt_text(meta: dict, scene: str) -> str:
    scene_en = scene.replace("-", " ")
    return (
        f"{meta['en']} {scene_en} — Peter South Island travel photography, New Zealand | "
        f"Peter 南岛旅拍 · {meta['zh']} {scene_en.replace('lake', '湖景').replace('snow', '雪山')}风光"
    )


def xhs_title(meta: dict, scene: str, index: int) -> str:
    templates = {
        "starry-night": f"✨ {meta['zh']}星空太绝了！新西兰南岛必打卡",
        "snow-peak": f"🏔️ {meta['zh']}雪山实拍｜南岛最震撼风景之一",
        "blue-lake": f"💙 {meta['zh']}湖水蓝到不真实｜新西兰旅拍",
        "vivid-landscape": f"📸 {meta['zh']}封神机位！色彩拉满的南岛风光",
    }
    if scene in templates:
        return templates[scene]
    return f"🇳🇿 {meta['zh']}旅拍｜新西兰南岛精选风景 {index:02d}"


def curate_folder(
    folder: Path,
    meta: dict,
    limit_min: int,
    limit_max: int,
    score_key: str,
) -> Tuple[List[ScoredPhoto], List[Path]]:
    if not folder.is_dir():
        return [], []
    files = sorted(p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in IMAGE_EXT)
    scored: List[ScoredPhoto] = []
    for f in files:
        s = score_photo(f, meta)
        if s:
            scored.append(s)
    picked = pick_diverse(scored, limit_min, limit_max, score_key)
    remove = [p.path for p in scored if p not in picked]
    return picked, remove


def apply_curation(
    root: Path,
    lib_name: str,
    limit_min: int,
    limit_max: int,
    score_key: str,
    channel: str,
) -> List[dict]:
    lib = root / lib_name
    rows: List[dict] = []
    for loc_folder in sorted(lib.iterdir()) if lib.is_dir() else []:
        if not loc_folder.is_dir():
            continue
        meta = LOCATION_META.get(loc_folder.name, LOCATION_META["Unknown-Location"])
        picked, remove = curate_folder(loc_folder, meta, limit_min, limit_max, score_key)
        for p in remove:
            p.unlink(missing_ok=True)
        used_names: set[str] = set()
        for i, photo in enumerate(picked, 1):
            ext = photo.path.suffix
            new_name = seo_filename(meta, photo.scene_kw, i, ext)
            while new_name.lower() in used_names:
                new_name = seo_filename(meta, photo.scene_kw + f"-{i}", i, ext)
            used_names.add(new_name.lower())
            original_name = photo.path.name
            dest = loc_folder / new_name
            if original_name != new_name:
                if dest.exists():
                    dest.unlink()
                photo.path.rename(dest)
            row = {
                "Channel": channel,
                "LocationFolder": loc_folder.name,
                "LocationEN": meta["en"],
                "LocationZH": meta["zh"],
                "OriginalFilename": original_name,
                "SEOFilename": new_name,
                "RelativePath": f"{lib_name}/{loc_folder.name}/{new_name}",
                "Resolution": f"{photo.width}x{photo.height}",
                "Score": round(photo.score, 1),
                "AltText": alt_text(meta, photo.scene_kw),
                "LocationTags": meta["tags"],
                "SceneKeyword": photo.scene_kw,
            }
            rows.append(row)
        print(f"  {lib_name}/{loc_folder.name}: kept {len(picked)}, removed {len(remove)}")
    return rows


def write_csv(path: Path, rows: List[dict], fields: Sequence[str]) -> None:
    with path.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=fields, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def run(root: Path) -> None:
    root = root.resolve()
    print(f"Round-2 curation: {root}\n")

    print("Website-Photos (5-10 per location, landscape/commercial priority):")
    web_rows = apply_curation(root, "Website-Photos", WEBSITE_MIN, WEBSITE_MAX, "website_score", "website")

    print("\nXiaohongshu-Photos (10-20 per location, visual impact priority):")
    xhs_rows = apply_curation(root, "Xiaohongshu-Photos", XHS_MIN, XHS_MAX, "xhs_score", "xiaohongshu")

    seo_fields = [
        "Channel", "LocationFolder", "LocationEN", "LocationZH",
        "OriginalFilename", "SEOFilename", "RelativePath", "Resolution",
        "Score", "AltText", "LocationTags", "SceneKeyword",
    ]
    write_csv(root / "photo-seo-report.csv", web_rows + xhs_rows, seo_fields)

    xhs_fields = [
        "LocationFolder", "LocationZH", "SEOFilename", "RelativePath",
        "XiaohongshuTitle", "LocationTags", "AltText",
    ]
    xhs_caption_rows = [
        {
            **{k: r[k] for k in ("LocationFolder", "LocationZH", "SEOFilename", "RelativePath", "LocationTags", "AltText")},
            "XiaohongshuTitle": xhs_title(
                LOCATION_META.get(r["LocationFolder"], LOCATION_META["Unknown-Location"]),
                r["SceneKeyword"],
                int(re.search(r"-(\d+)\.", r["SEOFilename"]).group(1)) if re.search(r"-(\d+)\.", r["SEOFilename"]) else 1,
            ),
        }
        for r in xhs_rows
    ]
    write_csv(root / "xiaohongshu-captions.csv", xhs_caption_rows,
              ["LocationFolder", "LocationZH", "SEOFilename", "RelativePath", "XiaohongshuTitle", "LocationTags", "AltText"])

    print(f"\n=== Done ===")
    print(f"Website kept: {len(web_rows)}")
    print(f"Xiaohongshu kept: {len(xhs_rows)}")
    print(f"  {root / 'photo-seo-report.csv'}")
    print(f"  {root / 'xiaohongshu-captions.csv'}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Round-2 curation for Website/XHS photo libraries.")
    parser.add_argument(
        "--root",
        type=Path,
        default=Path("/Users/yueshe/Desktop/NZ-Travel-photos "),
        help="NZ-Travel-photos root containing Website-Photos and Xiaohongshu-Photos",
    )
    args = parser.parse_args()
    if not args.root.is_dir():
        print(f"Not found: {args.root}", file=sys.stderr)
        sys.exit(1)
    run(args.root)


if __name__ == "__main__":
    main()
