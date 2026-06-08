#!/usr/bin/env python3
"""
Scan 客人好评 folder — OCR, classify, copy to Reviews/ center, pick top 30, generate CSV/MD/HTML.
Copy-only; never deletes originals.
"""
from __future__ import annotations

import argparse
import csv
import hashlib
import re
import shutil
import sys
import unicodedata
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heif", ".bmp", ".gif", ".tif", ".tiff"}
VIDEO_EXT = {".mov", ".mp4", ".m4v", ".avi", ".mkv", ".webm"}

CATEGORIES = {
    "wechat": "微信好评",
    "google": "Google Reviews",
    "tripadvisor": "Tripadvisor Reviews",
    "guest_photo": "客人合影",
    "feedback": "客户反馈截图",
    "video": "视频评价",
    "featured": "精选评价",
}

CATEGORY_DIRS = list(CATEGORIES.values())

POSITIVE_KW = (
    "棒", "好", "感谢", "推荐", "专业", "细心", "满意", "完美", "愉快", "幸运",
    "金牌", "贴心", "负责", "精彩", "excellent", "amazing", "great", "wonderful",
    "fantastic", "best", "love", "perfect", "recommend", "Peter", "peter",
)

REGION_KW = (
    "上海", "北京", "广州", "深圳", "江苏", "浙江", "成都", "重庆", "武汉", "西安",
    "新西兰", "奥克兰", "Auckland", "基督城", "Christchurch", "皇后镇", "Queenstown",
    "香港", "台湾", "新加坡", "马来西亚", "澳洲", "澳大利亚", "悉尼", "墨尔本",
)

SURNAME_RE = re.compile(r"([王李张刘陈杨黄赵周吴徐孙马朱胡郭何高林罗郑梁谢宋唐许韩冯邓曹彭曾肖田董潘袁蔡蒋余杜叶程苏魏吕丁任沈姚卢姜崔钟谭陆汪范金石廖贾夏韦付方邹熊孟秦白江阎薛尹段雷黎史龙陶贺毛郝顾龚邵万钱严覃武戴莫孔向汤])")


@dataclass
class ReviewItem:
    id: str
    source_file: str
    category_key: str
    category: str
    original_text: str
    display_text: str
    title_zh: str
    title_en: str
    guest_label: str
    image_copy: str = ""
    score: float = 0.0
    platform: str = ""


def slug_hash(text: str) -> str:
    return hashlib.md5(text.encode("utf-8")).hexdigest()[:10]


def init_ocr():
    import easyocr
    return easyocr.Reader(["ch_sim", "en"], gpu=False, verbose=False)


def ocr_image(reader, path: Path) -> str:
    try:
        lines = reader.readtext(str(path), detail=0, paragraph=True)
        if isinstance(lines, list):
            return "\n".join(str(x).strip() for x in lines if str(x).strip())
        return str(lines).strip()
    except Exception as exc:
        return f"[OCR error: {exc}]"


def is_screenshot(path: Path) -> bool:
    name = path.name.lower()
    return path.suffix.lower() == ".png" or "截屏" in name or "screenshot" in name or "screen" in name


def classify_file(path: Path, text: str) -> str:
    if path.suffix.lower() in VIDEO_EXT:
        return "video"
    name = path.name.lower()
    if name.startswith("review") or "reviews-" in name:
        if "service-04" in name or "service-service-04" in name:
            return "google"
        if "tripadvisor" in name or "trip" in name:
            return "tripadvisor"
        if "driving" in name or "service-03" in name or "return" in name:
            return "wechat"
        return "feedback"
    if not is_screenshot(path) and path.suffix.lower() in {".jpg", ".jpeg", ".heic", ".webp"}:
        return "guest_photo"
    blob = (text + " " + path.name).lower()
    if "tripadvisor" in blob or "trip advisor" in blob:
        return "tripadvisor"
    if "google" in blob or "local guide" in blob or "google review" in blob:
        return "google"
    if "微信" in text or "wechat" in blob or "聊天记录" in text:
        return "wechat"
    return "feedback"


def extract_location(text: str) -> Optional[str]:
    for r in REGION_KW:
        if r in text:
            return r
    m = re.search(r"(新西兰|New Zealand|Auckland|Christchurch|Queenstown)", text, re.I)
    return m.group(1) if m else None


def mask_guest_name(text: str, ocr_lines: str) -> str:
    """Return privacy-safe label like 上海王女士 or Auckland 张先生."""
    loc = extract_location(text) or extract_location(ocr_lines) or "新西兰"

    for line in ocr_lines.split("\n"):
        line = line.strip()
        if len(line) > 20 or len(line) < 2:
            continue
        if any(k in line for k in POSITIVE_KW[:15]):
            continue
        m = SURNAME_RE.search(line)
        if m:
            surname = m.group(1)
            if "女" in line or "女士" in line or "小姐" in line:
                return f"{loc}{surname}女士"
            if "男" in line or "先生" in line:
                return f"{loc}{surname}先生"
            return f"{loc}{surname}先生/女士"
        if re.match(r"^[A-Za-z\u4e00-\u9fff]{2,12}[-_·]?", line) and "Peter" not in line and "peter" not in line:
            return f"{loc}客人"

    m = SURNAME_RE.search(text)
    if m:
        return f"{loc}{m.group(1)}先生/女士"
    return f"{loc}客人"


def split_reviews_from_ocr(text: str, path: Path) -> List[str]:
    """Split one screenshot OCR into multiple review blocks when possible."""
    lines = [ln.strip() for ln in text.split("\n") if ln.strip()]
    if not lines:
        return [f"客户好评截图 — {path.stem}"]

    blocks: List[List[str]] = []
    current: List[str] = []

    def flush():
        if current:
            merged = clean_review_text(" ".join(current))
            if len(merged) >= 8:
                blocks.append(current[:])
            current.clear()

    for line in lines:
        is_header = (
            re.match(r"^\d{4}-\d{2}-\d{2}$", line)
            or line in REGION_KW
            or (len(line) <= 14 and not any(k in line for k in POSITIVE_KW) and "Peter" not in line)
        )
        if is_header and current and len(" ".join(current)) > 30:
            flush()
        current.append(line)
    flush()

    results = [clean_review_text(" ".join(b)) for b in blocks if clean_review_text(" ".join(b))]
    if results:
        return results
    single = clean_review_text(" ".join(lines))
    return [single] if len(single) >= 8 else [single or f"客户好评截图 — {path.stem}"]


def clean_review_text(text: str) -> str:
    lines = []
    skip = ("回复", "点赞", "收藏", "分享", "关注", "查看更多", "展开", "收起")
    for line in text.split("\n"):
        line = line.strip()
        if not line or len(line) < 4:
            continue
        if any(line == s or line.startswith(s) for s in skip):
            continue
        if re.match(r"^\d{4}-\d{2}-\d{2}$", line):
            continue
        lines.append(line)
    merged = " ".join(lines)
    merged = re.sub(r"\s+", " ", merged).strip()
    return merged


def shorten_for_web(text: str, max_len: int = 120) -> str:
    t = text.strip()
    if len(t) <= max_len:
        return t
    cut = t[:max_len]
    for sep in ("。", "！", "!", "，", ","):
        idx = cut.rfind(sep)
        if idx > 40:
            return cut[: idx + 1]
    return cut.rstrip() + "…"


def score_review(text: str) -> float:
    t = text.lower()
    score = min(len(text) / 8, 40)
    for kw in POSITIVE_KW:
        if kw.lower() in t:
            score += 6
    if "peter" in t:
        score += 15
    if any(x in text for x in ("导游", "司导", "带队", "服务")):
        score += 10
    if any(x in text for x in ("推荐", "感谢", "金牌", "专业")):
        score += 8
    return score


def gen_titles(text: str, guest: str) -> Tuple[str, str]:
    if "Peter" in text or "peter" in text:
        if any(x in text for x in ("专业", "讲解", "司导")):
            return "专业司导 Peter，行程省心又精彩", "Professional guide Peter — seamless South Island tour"
        return "客人大力推荐 Peter 南岛带队", "Guests highly recommend Peter's South Island tours"
    if any(x in text for x in ("观鲸", "whale")):
        return "凯库拉观鲸体验超赞", "Amazing Kaikoura whale watching experience"
    if any(x in text for x in ("奔驰", "商务", "vehicle", "Mercedes")):
        return "奔驰商务小团，舒适又有品质", "Mercedes small group tour — comfort and quality"
    return f"{guest}的真实好评", "Authentic guest review — Tian Tian Travel"


def platform_label(key: str) -> str:
    return {
        "wechat": "微信",
        "google": "Google",
        "tripadvisor": "Tripadvisor",
        "feedback": "客户反馈",
        "guest_photo": "客人合影",
        "video": "视频评价",
    }.get(key, "评价")


def scan_folder(source: Path) -> List[Path]:
    files: List[Path] = []
    for p in sorted(source.rglob("*")):
        if not p.is_file() or p.name.startswith("."):
            continue
        if "thumbs" in {part.lower() for part in p.parts}:
            continue
        ext = p.suffix.lower()
        if ext in IMAGE_EXT or ext in VIDEO_EXT:
            files.append(p)
    return files


def copy_to_category(src: Path, dest_dir: Path, used: set[str]) -> Path:
    dest_dir.mkdir(parents=True, exist_ok=True)
    name = src.name
    stem, ext = src.stem, src.suffix
    n = 1
    while name.lower() in used:
        name = f"{stem}_{n}{ext}"
        n += 1
    used.add(name.lower())
    dest = dest_dir / name
    shutil.copy2(src, dest)
    return dest


def build_html_featured(items: List[ReviewItem], out_path: Path) -> None:
    cards = []
    for it in items[:12]:
        img = it.image_copy.replace("\\", "/")
        cards.append(f"""
    <article class="rev-card">
      <figure class="rev-card-media">
        <img src="{img}" alt="{it.title_zh}" loading="lazy">
        <figcaption>{it.platform}</figcaption>
      </figure>
      <div class="rev-card-body">
        <p class="rev-card-guest">{it.guest_label}</p>
        <h3>{it.title_zh}</h3>
        <p class="rev-card-text">{it.display_text}</p>
      </div>
    </article>""")

    html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>客户真实评价精选 | Tian Tian Travel</title>
  <style>
    :root {{ font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif; color: #2f2f2f; }}
    body {{ margin: 0; background: #f7f5f0; }}
    .wrap {{ max-width: 1140px; margin: 0 auto; padding: 48px 20px 80px; }}
    h1 {{ font-size: clamp(1.8rem, 4vw, 2.6rem); margin: 0 0 8px; }}
    .lead {{ color: #666; margin-bottom: 32px; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }}
    .rev-card {{ background: #fff; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 24px rgba(0,0,0,.06); }}
    .rev-card-media {{ margin: 0; position: relative; }}
    .rev-card-media img {{ width: 100%; display: block; max-height: 280px; object-fit: cover; }}
    .rev-card-media figcaption {{ position: absolute; top: 10px; left: 10px; background: rgba(0,0,0,.65); color: #fff; font-size: 12px; padding: 4px 10px; border-radius: 999px; }}
    .rev-card-body {{ padding: 16px 18px 20px; }}
    .rev-card-guest {{ font-size: 13px; color: #888; margin: 0 0 6px; }}
    .rev-card-body h3 {{ margin: 0 0 10px; font-size: 1.05rem; }}
    .rev-card-text {{ margin: 0; line-height: 1.65; font-size: 0.95rem; color: #444; }}
  </style>
</head>
<body>
  <div class="wrap">
    <p>Guest Reviews</p>
    <h1>客户真实评价精选</h1>
    <p class="lead">来自微信、Google、Tripadvisor 及社交平台的真实反馈 — Peter 南岛精品小团</p>
    <div class="grid">
      {"".join(cards)}
    </div>
  </div>
</body>
</html>
"""
    out_path.write_text(html, encoding="utf-8")


def build_reviews_page_md(items: List[ReviewItem], counts: dict, root: Path) -> str:
    lines = [
        "# 客户评价中心",
        "",
        f"**生成时间：** {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}",
        f"**来源文件夹：** `{root / '客人好评'}`",
        "",
        "## 分类统计",
        "",
        "| 分类 | 文件数 |",
        "|------|--------|",
    ]
    for cat in CATEGORY_DIRS:
        if cat != "精选评价":
            lines.append(f"| {cat} | {counts.get(cat, 0)} |")
    lines.append(f"| 精选评价 | {min(30, len(items))} |")
    lines.extend(["", "## 精选 30 条客户好评", ""])
    for i, it in enumerate(items[:30], 1):
        lines.extend([
            f"### {i}. {it.title_zh}",
            "",
            f"- **客人：** {it.guest_label}",
            f"- **平台：** {it.platform}",
            f"- **英文标题：** {it.title_en}",
            f"- **原文：** {it.original_text[:200]}{'…' if len(it.original_text) > 200 else ''}",
            f"- **网站文案：** {it.display_text}",
            f"- **配图：** `{it.image_copy}`",
            "",
        ])
    return "\n".join(lines) + "\n"


def run(source_root: Path, output_root: Optional[Path] = None, extra_sources: Optional[List[Path]] = None) -> dict:
    source_root = source_root.resolve()
    reviews_src = source_root / "客人好评"
    if not reviews_src.is_dir():
        raise FileNotFoundError(f"客人好评 folder not found: {reviews_src}")

    out = (output_root or source_root).resolve()
    reviews_dir = out / "Reviews"
    if reviews_dir.exists():
        shutil.rmtree(reviews_dir)
    for cat in CATEGORY_DIRS:
        (reviews_dir / cat).mkdir(parents=True, exist_ok=True)

    print("Initializing OCR (EasyOCR)...")
    reader = init_ocr()

    files = scan_folder(reviews_src)
    for extra in extra_sources or []:
        if extra.is_dir():
            files.extend(scan_folder(extra))
    # dedupe by resolved path
    seen_fp: set[str] = set()
    unique_files: List[Path] = []
    for p in files:
        key = str(p.resolve())
        if key not in seen_fp:
            seen_fp.add(key)
            unique_files.append(p)
    files = unique_files
    print(f"Found {len(files)} files (客人好评 + 网站评价库)")

    used_names: Dict[str, set] = {k: set() for k in CATEGORIES}
    counts: Dict[str, int] = {v: 0 for v in CATEGORY_DIRS}
    all_items: List[ReviewItem] = []

    for idx, path in enumerate(files, 1):
        print(f"  [{idx}/{len(files)}] {path.name}")
        text = ""
        if path.suffix.lower() in IMAGE_EXT:
            text = ocr_image(reader, path)
        elif path.suffix.lower() in VIDEO_EXT:
            text = f"[视频评价] {path.name}"

        cat_key = classify_file(path, text)
        cat_dir = CATEGORIES[cat_key]
        copied = copy_to_category(path, reviews_dir / cat_dir, used_names[cat_key])
        counts[cat_dir] += 1

        body = clean_review_text(text)
        if len(body) < 8 and cat_key == "video":
            body = f"客人视频评价 — {path.stem}"
        review_texts = split_reviews_from_ocr(text, path) if path.suffix.lower() in IMAGE_EXT else [body]

        for sub_idx, body in enumerate(review_texts):
            if len(body) < 8:
                body = clean_review_text(text.replace("\n", " ")) or f"客户好评截图 — {path.stem}"

            guest = mask_guest_name(body, text)
            title_zh, title_en = gen_titles(body, guest)
            copy_path = copied if sub_idx == 0 else copy_to_category(
                path, reviews_dir / cat_dir, used_names[cat_key]
            )
            item = ReviewItem(
                id=slug_hash(body + path.name + str(sub_idx)),
                source_file=str(path),
                category_key=cat_key,
                category=cat_dir,
                original_text=body,
                display_text=shorten_for_web(body),
                title_zh=title_zh,
                title_en=title_en,
                guest_label=guest,
                image_copy=str(copy_path.relative_to(out)),
                score=score_review(body),
                platform=platform_label(cat_key),
            )
            all_items.append(item)

    all_items.sort(key=lambda x: -x.score)
    # dedupe similar text
    seen_text: set[str] = set()
    deduped: List[ReviewItem] = []
    for it in all_items:
        key = slug_hash(it.original_text[:120])
        if key in seen_text:
            continue
        seen_text.add(key)
        deduped.append(it)
    featured = deduped[:30]
    counts["精选评价"] = len(featured)

    for rank, it in enumerate(featured, 1):
        src = out / it.image_copy
        ext = src.suffix
        feat_name = f"featured-{rank:02d}-{it.id}{ext.lower()}"
        feat_dest = reviews_dir / "精选评价" / feat_name
        shutil.copy2(src, feat_dest)
        it.image_copy = str(feat_dest.relative_to(out))

    csv_path = out / "reviews-content.csv"
    with csv_path.open("w", encoding="utf-8-sig", newline="") as fh:
        fields = [
            "Rank", "GuestLabel", "Platform", "Category", "TitleZH", "TitleEN",
            "OriginalText", "DisplayText", "ImagePath", "SourceFile", "Score",
        ]
        w = csv.DictWriter(fh, fieldnames=fields)
        w.writeheader()
        for rank, it in enumerate(featured, 1):
            w.writerow({
                "Rank": rank,
                "GuestLabel": it.guest_label,
                "Platform": it.platform,
                "Category": it.category,
                "TitleZH": it.title_zh,
                "TitleEN": it.title_en,
                "OriginalText": it.original_text,
                "DisplayText": it.display_text,
                "ImagePath": it.image_copy,
                "SourceFile": it.source_file,
                "Score": round(it.score, 1),
            })

    md_path = out / "reviews-page.md"
    md_path.write_text(build_reviews_page_md(featured, counts, source_root), encoding="utf-8")

    html_path = reviews_dir / "reviews-featured.html"
    build_html_featured(featured, html_path)

    return {
        "total_files": len(files),
        "featured": len(featured),
        "counts": counts,
        "reviews_dir": str(reviews_dir),
        "csv": str(csv_path),
        "md": str(md_path),
        "html": str(html_path),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Build customer Reviews center from 客人好评.")
    parser.add_argument("--root", type=Path, default=Path("/Users/yueshe/Desktop/NZ-Travel-photos "))
    parser.add_argument("--output", type=Path, default=None)
    parser.add_argument(
        "--extra",
        type=Path,
        action="append",
        default=[],
        help="Additional review image folders to include (copy-only)",
    )
    args = parser.parse_args()
    repo = Path(__file__).resolve().parents[2]
    extras = list(args.extra)
    site_reviews = repo / "images/网页使用照片集/reviews"
    if site_reviews.is_dir() and site_reviews not in extras:
        extras.append(site_reviews)
    stats = run(args.root, args.output, extras)
    print("\n=== Reviews Center Complete ===")
    print(f"扫描文件: {stats['total_files']}")
    print(f"精选评价: {stats['featured']}")
    for cat, n in stats["counts"].items():
        if n:
            print(f"  {cat}: {n}")
    print(f"\nReviews:  {stats['reviews_dir']}")
    print(f"CSV:      {stats['csv']}")
    print(f"MD:       {stats['md']}")
    print(f"HTML:     {stats['html']}")


if __name__ == "__main__":
    main()
