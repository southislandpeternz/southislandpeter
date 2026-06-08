#!/usr/bin/env python3
"""
Build Website-Library resource center from Website-Photos + 5-star archive.
Copy-only for source originals; creates Website-Library, Web-Optimized, SEO CSV, page guide.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Sequence, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff"}

LIBRARY_FOLDERS = [
    "Homepage-Banner",
    "Mount-Cook",
    "Lake-Tekapo",
    "Queenstown",
    "Wanaka",
    "Kaikoura",
    "Milford-Sound",
    "Christchurch",
    "Akaroa",
    "Castle-Hill",
    "West-Coast",
    "Mercedes-Tour",
    "Whale-Watching",
    "Stargazing",
    "Alpaca-Farm",
    "Penguin-Tour",
]

WEBSITE_TO_LIBRARY = {
    "Mount-Cook": "Mount-Cook",
    "Lake-Tekapo": "Lake-Tekapo",
    "Queenstown": "Queenstown",
    "Wanaka": "Wanaka",
    "Kaikoura": "Kaikoura",
    "Milford-Sound": "Milford-Sound",
    "Christchurch": "Christchurch",
    "Akaroa": "Akaroa",
    "Castle-Hill": "Castle-Hill",
    "West-Coast": "West-Coast",
}

LOCATION_META: Dict[str, dict] = {
    "Mount-Cook": {"en": "Mount Cook", "zh": "库克山", "slug": "mount-cook", "keywords": "mount cook,aoraki,south island alps,hooker valley"},
    "Lake-Tekapo": {"en": "Lake Tekapo", "zh": "特卡波湖", "slug": "lake-tekapo", "keywords": "lake tekapo,church good shepherd,turquoise lake,lupins"},
    "Queenstown": {"en": "Queenstown", "zh": "皇后镇", "slug": "queenstown", "keywords": "queenstown,lake wakatipu,remarkables,gondola"},
    "Wanaka": {"en": "Wanaka", "zh": "瓦纳卡", "slug": "wanaka", "keywords": "wanaka,lake wanaka,lone tree,roys peak"},
    "Kaikoura": {"en": "Kaikoura", "zh": "凯库拉", "slug": "kaikoura", "keywords": "kaikoura,whale watching,coastal scenery"},
    "Milford-Sound": {"en": "Milford Sound", "zh": "米尔福德峡湾", "slug": "milford-sound", "keywords": "milford sound,mitre peak,fiordland,cruise"},
    "Christchurch": {"en": "Christchurch", "zh": "基督城", "slug": "christchurch", "keywords": "christchurch,canterbury,botanic gardens,cathedral"},
    "Akaroa": {"en": "Akaroa", "zh": "阿卡罗阿", "slug": "akaroa", "keywords": "akaroa,french village,harbour,alpaca"},
    "Castle-Hill": {"en": "Castle Hill", "zh": "城堡山", "slug": "castle-hill", "keywords": "castle hill,limestone boulders,canterbury"},
    "West-Coast": {"en": "West Coast", "zh": "西海岸", "slug": "west-coast", "keywords": "west coast,glacier,punakaiki,pancake rocks"},
    "Mercedes-Tour": {"en": "Mercedes Tour Vehicle", "zh": "奔驰商务小团", "slug": "mercedes-tour", "keywords": "mercedes v-class,luxury tour van,south island tour"},
    "Whale-Watching": {"en": "Kaikoura Whale Watching", "zh": "凯库拉观鲸", "slug": "kaikoura-whale-watching", "keywords": "whale watching,kaikoura,sperm whale,dolphin"},
    "Stargazing": {"en": "Lake Tekapo Stargazing", "zh": "特卡波星空", "slug": "tekapo-stargazing", "keywords": "milky way,dark sky,tekapo stars,astrophotography"},
    "Alpaca-Farm": {"en": "Akaroa Alpaca Farm", "zh": "阿卡罗阿羊驼", "slug": "akaroa-alpaca", "keywords": "alpaca farm,akaroa,animals,family tour"},
    "Penguin-Tour": {"en": "Penguin Tour", "zh": "企鹅之旅", "slug": "penguin-tour", "keywords": "penguin colony,oamaru,blue penguin,wildlife"},
    "Homepage-Banner": {"en": "South Island New Zealand", "zh": "新西兰南岛", "slug": "south-island", "keywords": "new zealand,south island,travel photography,peter tour"},
    "Unknown-Location": {"en": "South Island New Zealand", "zh": "新西兰南岛", "slug": "south-island", "keywords": "new zealand,scenic landscape"},
}

BANNER_THEMES = {
    "mountain": ("Mount-Cook", "Milford-Sound", "Castle-Hill"),
    "lake": ("Lake-Tekapo", "Wanaka", "Queenstown"),
    "stars": ("Stargazing", "Lake-Tekapo"),
    "mercedes": ("Mercedes-Tour",),
    "whale": ("Whale-Watching", "Kaikoura"),
    "group": ("Mercedes-Tour", "Unknown-Location"),
}

THEME_KEYWORDS = {
    "mercedes": ("mercedes", "benz", "v-class", "奔驰", "商务车", "vehicle"),
    "whale": ("whale", "观鲸", "kaikoura", "dolphin", "seal"),
    "stars": ("star", "milky", "night", "galaxy", "星空", "astro", "stargaz"),
    "alpaca": ("alpaca", "羊驼", "akaroa"),
    "penguin": ("penguin", "企鹅", "oamaru"),
    "group": ("guest", "group", "family", "合影", "客人", "tour"),
}


@dataclass
class ImageEntry:
    source: Path
    category: str
    seo_name: str
    score: float = 0.0
    scene: str = "scenic"
    width: int = 0
    height: int = 0


def has_sips() -> bool:
    try:
        subprocess.run(["which", "sips"], capture_output=True, check=True)
        return True
    except subprocess.CalledProcessError:
        return False


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


def dhash(gray, size: int = 12) -> str:
    import cv2

    img = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA)
    diff = img[:, 1:] > img[:, :-1]
    return "".join("1" if v else "0" for v in diff.flatten())


def hamming(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def scene_detect(bgr, gray, path: Path, category: str) -> str:
    import cv2

    name = path.name.lower()
    dark = float((gray < 55).mean())
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean())
    white = float((gray > 200).mean())

    if any(k in name for k in THEME_KEYWORDS["whale"]) or category in ("Whale-Watching",):
        return "whale-watching-tour"
    if any(k in name for k in THEME_KEYWORDS["mercedes"]) or category == "Mercedes-Tour":
        return "mercedes-v-class-tour"
    if dark > 0.42 and category in ("Stargazing", "Lake-Tekapo"):
        return "milky-way-stars"
    if any(k in name for k in THEME_KEYWORDS["alpaca"]) or category == "Alpaca-Farm":
        return "alpaca-farm"
    if any(k in name for k in THEME_KEYWORDS["penguin"]) or category == "Penguin-Tour":
        return "penguin-colony"
    if category == "Mount-Cook":
        if "hooker" in name:
            return "hooker-valley-track"
        if white > 0.2:
            return "snow-mountain-aoraki"
        return "mount-cook-scenic"
    if category == "Lake-Tekapo":
        if "church" in name or "shepherd" in name:
            return "church-of-good-shepherd"
        return "turquoise-lake"
    if category == "Milford-Sound":
        return "mitre-peak-fiord"
    if category == "Kaikoura":
        return "coastal-scenery"
    if sat > 100:
        return "vivid-landscape"
    return "scenic-view"


def score_image(path: Path, category: str) -> Tuple[float, str, int, int, str]:
    loaded = load_cv(path)
    if loaded is None:
        return 0.0, "scenic", 0, 0, ""
    bgr, gray, w, h = loaded
    import cv2

    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    mean_b = float(gray.mean())
    ar = w / h if h else 1
    mp = (w * h) / 1e6
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean() / 255.0)

    sharp = min(1.0, lap / 450)
    res = min(1.0, max(w, h) / 3200) * min(1.0, mp / 8)
    exposure = 1.0 - (0.3 if mean_b < 35 or mean_b > 220 else 0)
    landscape_bonus = 15 if ar >= 1.15 else 0
    banner_bonus = 10 if category == "Homepage-Banner" else 0

    scene = scene_detect(bgr, gray, path, category)
    theme_bonus = 0
    if scene in ("whale-watching-tour", "mercedes-v-class-tour", "milky-way-stars"):
        theme_bonus = 12
    if scene in ("hooker-valley-track", "church-of-good-shepherd", "mitre-peak-fiord"):
        theme_bonus = 8

    score = sharp * 28 + res * 20 + exposure * 15 + sat * 12 + landscape_bonus + banner_bonus + theme_bonus
    return score, scene, w, h, dhash(gray)


def seo_filename(category: str, scene: str, index: int, ext: str = ".jpg") -> str:
    meta = LOCATION_META.get(category, LOCATION_META["Unknown-Location"])
    slug = meta["slug"]
    scene = re.sub(r"[^a-z0-9]+", "-", scene.lower()).strip("-")
    return f"{slug}-{scene}-new-zealand-{index:02d}{ext.lower()}"


def alt_texts(category: str, scene: str) -> Tuple[str, str]:
    meta = LOCATION_META.get(category, LOCATION_META["Unknown-Location"])
    scene_en = scene.replace("-", " ")
    en = f"{meta['en']} {scene_en} — Peter South Island tour photography, New Zealand"
    zh = f"Peter 南岛旅拍 · {meta['zh']} {scene_en} 实景照片"
    return en, zh


def copy_as_jpg(src: Path, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if src.suffix.lower() in {".jpg", ".jpeg"} and src.suffix.lower() == dest.suffix.lower():
        shutil.copy2(src, dest)
        return
    if has_sips():
        subprocess.run(["sips", "-s", "format", "jpeg", str(src), "--out", str(dest)], check=True, capture_output=True)
    else:
        from PIL import Image

        with Image.open(src) as im:
            im.convert("RGB").save(dest, "JPEG", quality=95)


def optimize_web(src: Path, dest: Path, width: int = 1920, quality: int = 85) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if has_sips():
        subprocess.run(["sips", "-Z", str(width), "-s", "format", "jpeg", "-s", "formatOptions", str(quality),
                        str(src), "--out", str(dest)], check=True, capture_output=True)
    else:
        from PIL import Image

        with Image.open(src) as im:
            im = im.convert("RGB")
            w, h = im.size
            if max(w, h) > width:
                im.thumbnail((width, width * 10), Image.Resampling.LANCZOS)
            im.save(dest, "JPEG", quality=quality, optimize=True)


def index_photos(root: Path) -> Dict[str, List[Path]]:
    skip = {"Website-Library", "Web-Optimized", "Website-Photos", "Xiaohongshu-Photos", "Photo-Review"}
    by_name: Dict[str, List[Path]] = defaultdict(list)
    for p in root.rglob("*"):
        if not p.is_file() or p.suffix.lower() not in IMAGE_EXT:
            continue
        if any(part in skip for part in p.parts):
            continue
        by_name[p.name.lower()].append(p)
    return by_name


def load_five_star(rating_csv: Path) -> List[dict]:
    rows = []
    with rating_csv.open(encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            if "★★★★★" in row.get("Rating", ""):
                rows.append(row)
    return rows


def resolve_source(name: str, index: Dict[str, List[Path]]) -> Optional[Path]:
    hits = index.get(name.lower(), [])
    if not hits:
        return None
    return max(hits, key=lambda p: p.stat().st_size)


def classify_themed(path: Path, location: str) -> Optional[str]:
    text = f"{path} {location}".lower()
    if any(k in text for k in THEME_KEYWORDS["mercedes"]):
        return "Mercedes-Tour"
    if any(k in text for k in THEME_KEYWORDS["whale"]) or location == "Kaikoura":
        if any(k in text for k in ("whale", "观鲸", "dolphin", "seal", "kaikoura")):
            return "Whale-Watching"
    if any(k in text for k in THEME_KEYWORDS["stars"]) or "star" in path.name.lower():
        return "Stargazing"
    if any(k in text for k in THEME_KEYWORDS["alpaca"]):
        return "Alpaca-Farm"
    if any(k in text for k in THEME_KEYWORDS["penguin"]):
        return "Penguin-Tour"
    return None


def pick_banners(
    five_star: List[dict],
    index: Dict[str, List[Path]],
    website_photos: Path,
    limit: int = 20,
) -> List[ImageEntry]:
    candidates: List[ImageEntry] = []
    seen_paths: set[str] = set()

    def add_candidate(src: Path, loc: str, bonus: float = 0) -> None:
        key = str(src.resolve())
        if key in seen_paths:
            return
        seen_paths.add(key)
        score, scene, w, h, _ = score_image(src, "Homepage-Banner")
        candidates.append(ImageEntry(src, "Homepage-Banner", "", score + bonus, scene, w, h))

    for row in five_star:
        src = resolve_source(row["Filename"], index)
        if src:
            add_candidate(src, row.get("Location", ""))

    if website_photos.is_dir():
        for folder in website_photos.iterdir():
            if not folder.is_dir():
                continue
            for f in folder.iterdir():
                if f.suffix.lower() in IMAGE_EXT:
                    add_candidate(f, folder.name, bonus=8)

    candidates.sort(key=lambda e: -e.score)

    def dh_of(entry: ImageEntry) -> str:
        loaded = load_cv(entry.source)
        return dhash(loaded[1]) if loaded else ""

    picked: List[ImageEntry] = []
    dh_seen: List[str] = []

    def pick_from(pool: List[ImageEntry], n: int) -> None:
        for c in pool:
            if len(picked) >= limit or sum(1 for p in picked if p in pool) >= n:
                break
            if c in picked:
                continue
            dh = dh_of(c)
            if dh and any(hamming(dh, d) < 9 for d in dh_seen):
                continue
            picked.append(c)
            if dh:
                dh_seen.append(dh)

    mountains = [c for c in candidates if c.scene in ("mount-cook-scenic", "snow-mountain-aoraki", "hooker-valley-track", "mitre-peak-fiord") or "mount-cook" in str(c.source).lower()]
    lakes = [c for c in candidates if "lake" in c.scene or "tekapo" in str(c.source).lower() or "wanaka" in str(c.source).lower()]
    stars = [c for c in candidates if c.scene == "milky-way-stars" or "star" in str(c.source).lower()]
    mercedes = [c for c in candidates if c.scene == "mercedes-v-class-tour" or "mercedes" in str(c.source).lower() or "vehicle" in str(c.source).lower()]
    whales = [c for c in candidates if c.scene == "whale-watching-tour" or "whale" in str(c.source).lower() or "kaikoura" in str(c.source).lower()]
    groups = [c for c in candidates if "guest" in str(c.source).lower() or "group" in str(c.source).lower()]

    for pool, n in [(mountains, 4), (lakes, 4), (stars, 3), (mercedes, 3), (whales, 3), (groups, 2)]:
        pick_from(pool, n)

    for c in candidates:
        if len(picked) >= limit:
            break
        if c in picked:
            continue
        dh = dh_of(c)
        if dh and any(hamming(dh, d) < 9 for d in dh_seen):
            continue
        picked.append(c)
        if dh:
            dh_seen.append(dh)

    for i, e in enumerate(picked[:limit], 1):
        e.seo_name = seo_filename("Homepage-Banner", e.scene, i)
    return picked[:limit]


def build_library(root: Path) -> dict:
    root = root.resolve()
    website_photos = root / "Website-Photos"
    rating_csv = root / "photo-rating.csv"
    lib_root = root / "Website-Library"
    opt_root = root / "Web-Optimized"

    if lib_root.exists():
        shutil.rmtree(lib_root)
    if opt_root.exists():
        shutil.rmtree(opt_root)

    for folder in LIBRARY_FOLDERS:
        (lib_root / folder).mkdir(parents=True, exist_ok=True)

    index = index_photos(root)
    five_star = load_five_star(rating_csv) if rating_csv.exists() else []

    all_entries: List[ImageEntry] = []
    counts: Dict[str, int] = defaultdict(int)

    print("1. Copying Website-Photos → Website-Library location folders...")
    for src_folder, dst_cat in WEBSITE_TO_LIBRARY.items():
        src_dir = website_photos / src_folder
        if not src_dir.is_dir():
            continue
        files = sorted(f for f in src_dir.iterdir() if f.suffix.lower() in IMAGE_EXT)
        used: set[str] = set()
        for i, f in enumerate(files, 1):
            score, scene, w, h, _ = score_image(f, dst_cat)
            seo = seo_filename(dst_cat, scene, i, ".jpg")
            while seo.lower() in used:
                i += 1
                seo = seo_filename(dst_cat, scene, i, ".jpg")
            used.add(seo.lower())
            dest = lib_root / dst_cat / seo
            copy_as_jpg(f, dest)
            all_entries.append(ImageEntry(dest, dst_cat, seo, score, scene, w, h))
            counts[dst_cat] += 1

    print("2. Building themed categories...")
    themed_sources: Dict[str, List[Path]] = defaultdict(list)

    for row in five_star:
        src = resolve_source(row["Filename"], index)
        if src is None:
            continue
        loc = row.get("Location", "")
        themed = classify_themed(src, loc)
        if themed:
            themed_sources[themed].append(src)

    for src_folder in website_photos.iterdir() if website_photos.is_dir() else []:
        for f in src_folder.iterdir() if src_folder.is_dir() else []:
            if f.suffix.lower() not in IMAGE_EXT:
                continue
            themed = classify_themed(f, src_folder.name)
            if themed:
                themed_sources[themed].append(f)

    mercedes_dirs = [
        root / "小红书素材库" / "小红书-奔驰商务车精选",
        root / "奔驰商务车",
    ]
    for d in mercedes_dirs:
        if d.is_dir():
            for f in d.rglob("*"):
                if f.is_file() and f.suffix.lower() in IMAGE_EXT:
                    themed_sources["Mercedes-Tour"].append(f)

    for cat in ("Mercedes-Tour", "Whale-Watching", "Stargazing", "Alpaca-Farm", "Penguin-Tour"):
        sources = list(dict.fromkeys(themed_sources[cat]))[:10]
        used: set[str] = set()
        for i, src in enumerate(sources, 1):
            score, scene, w, h, _ = score_image(src, cat)
            seo = seo_filename(cat, scene, i, ".jpg")
            while seo.lower() in used:
                i += 1
                seo = seo_filename(cat, scene, i, ".jpg")
            used.add(seo.lower())
            dest = lib_root / cat / seo
            copy_as_jpg(src, dest)
            all_entries.append(ImageEntry(dest, cat, seo, score, scene, w, h))
            counts[cat] += 1

    print("3. Selecting 20 Homepage-Banner photos from 5-star archive...")
    banners = pick_banners(five_star, index, website_photos, 20)
    for e in banners:
        dest = lib_root / "Homepage-Banner" / e.seo_name
        copy_as_jpg(e.source, dest)
        e.source = dest
        all_entries.append(ImageEntry(dest, "Homepage-Banner", e.seo_name, e.score, e.scene, e.width, e.height))
    counts["Homepage-Banner"] = len(banners)

    print("4. Generating Web-Optimized (1920px, JPG 85%)...")
    for folder in LIBRARY_FOLDERS:
        src_dir = lib_root / folder
        if not src_dir.is_dir():
            continue
        for f in src_dir.iterdir():
            if f.suffix.lower() not in IMAGE_EXT:
                continue
            opt_dest = opt_root / folder / f.name
            if opt_dest.suffix.lower() != ".jpg":
                opt_dest = opt_dest.with_suffix(".jpg")
            optimize_web(f, opt_dest)

    print("5. Writing website-image-seo.csv...")
    seo_rows = []
    for e in all_entries:
        if not e.source.exists():
            continue
        meta = LOCATION_META.get(e.category, LOCATION_META["Unknown-Location"])
        en, zh = alt_texts(e.category, e.scene)
        rel = e.source.relative_to(lib_root)
        seo_rows.append({
            "FileName": e.seo_name or e.source.name,
            "Location": meta["en"],
            "AltTextEN": en,
            "AltTextCN": zh,
            "Keywords": meta["keywords"],
            "Category": e.category,
            "RelativePath": str(rel),
        })
    seo_csv = root / "website-image-seo.csv"
    with seo_csv.open("w", encoding="utf-8-sig", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["FileName", "Location", "AltTextEN", "AltTextCN", "Keywords", "Category", "RelativePath"])
        w.writeheader()
        w.writerows(seo_rows)

    print("6. Writing website-page-image-guide.md...")
    guide = build_page_guide(all_entries, counts, lib_root)
    (root / "website-page-image-guide.md").write_text(guide, encoding="utf-8")

    total = sum(counts.values())
    stats = {
        "banner": counts["Homepage-Banner"],
        "by_category": dict(counts),
        "total": total,
        "seo_csv": str(seo_csv),
        "guide": str(root / "website-page-image-guide.md"),
        "library": str(lib_root),
        "optimized": str(opt_root),
    }
    return stats


def build_page_guide(entries: List[ImageEntry], counts: dict, lib_root: Path) -> str:
    by_cat: Dict[str, List[ImageEntry]] = defaultdict(list)
    for e in entries:
        by_cat[e.category].append(e)
    for cat in by_cat:
        by_cat[cat].sort(key=lambda x: -x.score)

    def top(cat: str, n: int = 5) -> List[str]:
        return [f"- `{e.seo_name or e.source.name}` — {e.scene.replace('-', ' ')}" for e in by_cat[cat][:n]]

    lines = [
        "# 官网页面图片推荐指南",
        "",
        f"**素材库路径：** `{lib_root}`",
        f"**Web 优化版：** `{lib_root.parent / 'Web-Optimized'}`",
        "",
        "## 统计",
        "",
        f"| 类别 | 数量 |",
        f"|------|------|",
    ]
    for cat in LIBRARY_FOLDERS:
        if counts.get(cat):
            lines.append(f"| {cat} | {counts[cat]} |")
    lines.append(f"| **合计** | **{sum(counts.values())}** |")
    lines.extend([
        "",
        "## 首页推荐图片",
        "",
        "使用 `Homepage-Banner/` 全部 20 张轮播或 Hero 背景，优先横版高分图。",
        "",
        *top("Homepage-Banner", 8),
        "",
        "## 关于我们页面",
        "",
        "推荐奔驰商务车 + 客人合影 + Peter 团队场景：",
        "",
        *top("Mercedes-Tour", 3),
        *top("Christchurch", 2),
        "",
        "## 奔驰商务小团页面",
        "",
        *top("Mercedes-Tour", 5),
        *top("Mount-Cook", 2),
        *top("Lake-Tekapo", 2),
        "",
        "## 观鲸页面",
        "",
        *top("Whale-Watching", 5),
        *top("Kaikoura", 3),
        "",
        "## 库克山页面",
        "",
        *top("Mount-Cook", 5),
        "",
        "## 特卡波页面",
        "",
        *top("Lake-Tekapo", 5),
        *top("Stargazing", 3),
        "",
        "## 皇后镇页面",
        "",
        *top("Queenstown", 5),
        *top("Wanaka", 2),
        "",
        "## 使用说明",
        "",
        "- 网站部署请使用 `Web-Optimized/` 目录（1920px 宽，JPG 85%）",
        "- SEO 信息见 `website-image-seo.csv`",
        "- 原图备份在 `Website-Library/`",
        "",
    ])
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Website-Library resource center.")
    parser.add_argument("--root", type=Path, default=Path("/Users/yueshe/Desktop/NZ-Travel-photos "))
    args = parser.parse_args()
    if not args.root.is_dir():
        print(f"Not found: {args.root}", file=sys.stderr)
        sys.exit(1)
    stats = build_library(args.root)
    print("\n=== Website Library Complete ===")
    print(f"首页 Banner: {stats['banner']}")
    print(f"总网站素材: {stats['total']}")
    print("\n各景点数量:")
    for cat in LIBRARY_FOLDERS:
        if stats["by_category"].get(cat):
            print(f"  {cat}: {stats['by_category'][cat]}")
    print(f"\nWebsite-Library: {stats['library']}")
    print(f"Web-Optimized:   {stats['optimized']}")
    print(f"SEO CSV:         {stats['seo_csv']}")
    print(f"Page guide:      {stats['guide']}")


if __name__ == "__main__":
    main()
