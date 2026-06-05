#!/usr/bin/env python3
"""Scan inbox for duplicates, screenshots, Live Photos, blur, exposure — report only."""

from __future__ import annotations

import argparse
import hashlib
import os
import sys
from collections import defaultdict
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import INBOX_DIR, PHOTO_ROOT, REPORTS_DIR, VIDEO_EXTENSIONS  # noqa: E402
from inbox_scan import ALL_IMAGE_EXTENSIONS, scan_inbox  # noqa: E402
from library_paths import discover_photo_root  # noqa: E402

PHOTO_EXTS = ALL_IMAGE_EXTENSIONS - {".png"}  # photos for blur/exposure (exclude png)
BLUR_THRESHOLD = 80.0  # Laplacian variance; lower = more blurred
EXPOSURE_DARK_RATIO = 0.42
EXPOSURE_BRIGHT_RATIO = 0.38
EXPOSURE_MEAN_LOW = 35
EXPOSURE_MEAN_HIGH = 220

REPORT_FILES = {
    "duplicate_photos": "duplicate-photos.md",
    "duplicate_videos": "duplicate-videos.md",
    "screenshots": "screenshots.md",
    "live_photos": "live-photos.md",
    "blurred_photos": "blurred-photos.md",
    "exposure_issues": "exposure-issues.md",
}


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def _md5(path: Path, chunk: int = 1 << 20) -> str:
    h = hashlib.md5()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(chunk), b""):
            h.update(block)
    return h.hexdigest()


def find_exact_duplicates(paths: Sequence[Path]) -> List[List[Path]]:
    by_size: Dict[int, List[Path]] = defaultdict(list)
    for p in paths:
        try:
            by_size[p.stat().st_size].append(p)
        except OSError:
            continue

    groups: List[List[Path]] = []
    for size, candidates in by_size.items():
        if len(candidates) < 2:
            continue
        by_hash: Dict[str, List[Path]] = defaultdict(list)
        for p in candidates:
            try:
                by_hash[_md5(p)].append(p)
            except OSError:
                continue
        for files in by_hash.values():
            if len(files) > 1:
                groups.append(sorted(files, key=lambda x: x.name.lower()))
    groups.sort(key=lambda g: (-len(g), g[0].name.lower()))
    return groups


def _is_screenshot(path: Path) -> bool:
    if path.suffix.lower() != ".png":
        return False
    name = path.stem.lower()
    if "screenshot" in name or "screen shot" in name or "截屏" in name or "截图" in name:
        return True
    # iOS/macOS UUID-style PNG exports
    if len(path.stem) >= 32 and path.stem.replace("-", "").isalnum():
        return True
    try:
        from PIL import Image

        with Image.open(path) as img:
            w, h = img.size
            ratio = max(w, h) / max(min(w, h), 1)
            # Common phone screenshot aspect ratios
            if ratio in range(16, 23) or (w, h) in {(1170, 2532), (1284, 2778), (1290, 2796), (1080, 1920)}:
                return True
    except Exception:
        pass
    return True  # default: inbox PNG treated as screenshot per user request


def find_live_photo_pairs(
    images: Sequence[Path], videos: Sequence[Path]
) -> List[Tuple[Path, Path]]:
    video_by_stem = {p.stem.lower(): p for p in videos}
    pairs: List[Tuple[Path, Path]] = []
    for img in images:
        stem = img.stem.lower()
        if stem not in video_by_stem:
            continue
        vid = video_by_stem[stem]
        if img.suffix.lower() in {".jpg", ".jpeg", ".heic", ".heif"} and vid.suffix.lower() in {
            ".mov", ".m4v", ".mp4"
        }:
            pairs.append((img, vid))
    pairs.sort(key=lambda x: x[0].name.lower())
    return pairs


def _analyze_image_quality(path_str: str) -> Optional[dict]:
    path = Path(path_str)
    try:
        import cv2
        import numpy as np

        data = np.fromfile(str(path), dtype=np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if img is None:
            return None
        h, w = img.shape[:2]
        scale = min(1.0, 800 / max(h, w))
        if scale < 1.0:
            img = cv2.resize(img, (int(w * scale), int(h * scale)))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())
        mean_b = float(gray.mean())
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        total = hist.sum() or 1
        dark_ratio = float(hist[:26].sum() / total)
        bright_ratio = float(hist[230:].sum() / total)
        issues = []
        if lap_var < BLUR_THRESHOLD:
            issues.append("blurred")
        if dark_ratio >= EXPOSURE_DARK_RATIO or mean_b < EXPOSURE_MEAN_LOW:
            issues.append("underexposed")
        if bright_ratio >= EXPOSURE_BRIGHT_RATIO or mean_b > EXPOSURE_MEAN_HIGH:
            issues.append("overexposed")
        if not issues:
            return None
        return {
            "path": path_str,
            "lap_var": round(lap_var, 1),
            "mean_brightness": round(mean_b, 1),
            "dark_ratio": round(dark_ratio, 3),
            "bright_ratio": round(bright_ratio, 3),
            "issues": issues,
        }
    except Exception:
        try:
            from PIL import Image, ImageFilter

            with Image.open(path) as img:
                img = img.convert("L")
                img.thumbnail((800, 800))
                edges = img.filter(ImageFilter.FIND_EDGES)
                pixels = list(edges.getdata())
                mean_edge = sum(pixels) / len(pixels)
                lap_var = sum((p - mean_edge) ** 2 for p in pixels) / len(pixels)
                pixels_l = list(img.getdata())
                mean_b = sum(pixels_l) / len(pixels_l)
                dark = sum(1 for p in pixels_l if p < 26) / len(pixels_l)
                bright = sum(1 for p in pixels_l if p > 230) / len(pixels_l)
            issues = []
            if lap_var < BLUR_THRESHOLD * 8:
                issues.append("blurred")
            if dark >= EXPOSURE_DARK_RATIO or mean_b < EXPOSURE_MEAN_LOW:
                issues.append("underexposed")
            if bright >= EXPOSURE_BRIGHT_RATIO or mean_b > EXPOSURE_MEAN_HIGH:
                issues.append("overexposed")
            if not issues:
                return None
            return {
                "path": path_str,
                "lap_var": round(lap_var, 1),
                "mean_brightness": round(mean_b, 1),
                "dark_ratio": round(dark, 3),
                "bright_ratio": round(bright, 3),
                "issues": issues,
            }
        except Exception:
            return None


def _scan_quality(paths: Sequence[Path], workers: int) -> Tuple[List[dict], List[dict]]:
    blurred: List[dict] = []
    exposure: List[dict] = []
    photo_paths = [
        str(p) for p in paths
        if p.suffix.lower() in PHOTO_EXTS or p.suffix.lower() in {".jpg", ".jpeg", ".heic", ".heif"}
    ]
    if not photo_paths:
        return blurred, exposure

    workers = max(1, min(workers, os.cpu_count() or 4))
    with ProcessPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(_analyze_image_quality, p): p for p in photo_paths}
        done = 0
        total = len(photo_paths)
        for fut in as_completed(futures):
            done += 1
            if done % 500 == 0:
                print(f"  quality scan: {done}/{total}", flush=True)
            row = fut.result()
            if not row:
                continue
            if "blurred" in row["issues"]:
                blurred.append(row)
            if "underexposed" in row["issues"] or "overexposed" in row["issues"]:
                exposure.append(row)
    blurred.sort(key=lambda x: x["lap_var"])
    exposure.sort(key=lambda x: x["mean_brightness"])
    return blurred, exposure


def _rel(path: Path, base: Path) -> str:
    try:
        return str(path.relative_to(base))
    except ValueError:
        return str(path)


def _write_duplicate_report(
    title: str, groups: List[List[Path]], base: Path, out: Path, scanned: int
) -> None:
    dup_files = sum(len(g) for g in groups)
    wasted = sum(g[0].stat().st_size * (len(g) - 1) for g in groups if g)
    lines = [
        f"# {title}",
        "",
        f"- 生成时间 (UTC): {datetime.now(timezone.utc).isoformat()}",
        f"- 扫描目录: `{base / INBOX_DIR}`",
        f"- 扫描文件数: **{scanned}**",
        f"- 重复组数: **{len(groups)}**",
        f"- 涉及文件: **{dup_files}**",
        f"- 可释放空间（若每组保留 1 个）: **{_fmt_bytes(wasted)}**",
        "",
        "> 未删除任何文件，请确认后再执行清理。",
        "",
    ]
    if not groups:
        lines.append("_未发现完全重复文件（内容 MD5 相同）_")
    else:
        for i, group in enumerate(groups, 1):
            lines.append(f"## 组 {i}（{len(group)} 个文件）")
            lines.append("")
            for p in group:
                try:
                    size = p.stat().st_size
                except OSError:
                    size = 0
                lines.append(f"- `{_rel(p, base)}` — {_fmt_bytes(size)}")
            lines.append("")
    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def _fmt_bytes(n: int) -> str:
    for unit in ("B", "KB", "MB", "GB"):
        if n < 1024:
            return f"{n:.1f} {unit}" if unit != "B" else f"{n} B"
        n /= 1024
    return f"{n:.1f} TB"


def _write_list_report(
    title: str,
    items: Iterable[Tuple[str, str]],
    base: Path,
    out: Path,
    extra_header: str = "",
) -> None:
    items = list(items)
    lines = [
        f"# {title}",
        "",
        f"- 生成时间 (UTC): {datetime.now(timezone.utc).isoformat()}",
        f"- 扫描目录: `{base / INBOX_DIR}`",
        f"- 数量: **{len(items)}**",
        "",
        "> 未删除任何文件，请确认后再执行清理。",
        "",
    ]
    if extra_header:
        lines.append(extra_header)
        lines.append("")
    if not items:
        lines.append("_无_")
    else:
        for name, detail in items:
            lines.append(f"- `{name}` — {detail}")
    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def _write_quality_report(
    title: str, rows: List[dict], base: Path, out: Path, metric: str
) -> None:
    lines = [
        f"# {title}",
        "",
        f"- 生成时间 (UTC): {datetime.now(timezone.utc).isoformat()}",
        f"- 扫描目录: `{base / INBOX_DIR}`",
        f"- 数量: **{len(rows)}**",
        f"- 阈值: {metric}",
        "",
        "> 未删除任何文件，请确认后再执行清理。",
        "",
        "| 文件 | 清晰度 | 亮度 | 暗部占比 | 亮部占比 |",
        "|------|--------|------|----------|----------|",
    ]
    if not rows:
        lines.append("| _无_ | | | | |")
    else:
        for row in rows:
            p = Path(row["path"])
            lines.append(
                f"| `{_rel(p, base)}` | {row['lap_var']} | {row['mean_brightness']} "
                f"| {row['dark_ratio']} | {row['bright_ratio']} |"
            )
    out.write_text("\n".join(lines).rstrip() + "\n", encoding="utf-8")


def run_audit(
    root: Path,
    photo_root_arg: Path | None = None,
    workers: int = 6,
) -> dict[str, Path]:
    photos_base = photo_root_arg.resolve() if photo_root_arg else discover_photo_root(root, scan_inbox)
    inbox = photos_base / INBOX_DIR
    reports_dir = photos_base / REPORTS_DIR
    reports_dir.mkdir(parents=True, exist_ok=True)

    print(f"Photo library: {photos_base}")
    print(f"Scanning: {inbox}")
    stats = scan_inbox(inbox)
    images = stats.images
    videos = stats.videos

    photo_files = [p for p in images if p.suffix.lower() != ".png"]
    png_files = [p for p in images if p.suffix.lower() == ".png"]
    video_files = list(videos)

    print(f"  images: {len(images)} (photos {len(photo_files)}, png {len(png_files)})")
    print(f"  videos: {len(video_files)}")

    print("Finding duplicate photos...")
    dup_photos = find_exact_duplicates(photo_files)
    print(f"  {len(dup_photos)} duplicate photo groups")

    print("Finding duplicate videos...")
    dup_videos = find_exact_duplicates(video_files)
    print(f"  {len(dup_videos)} duplicate video groups")

    print("Finding screenshots (PNG)...")
    screenshots = [(p, "PNG") for p in png_files if _is_screenshot(p)]
    print(f"  {len(screenshots)} screenshots")

    print("Finding Live Photo pairs (JPG/HEIC + MOV)...")
    live_pairs = find_live_photo_pairs(images, videos)
    print(f"  {len(live_pairs)} Live Photo pairs")

    print("Analyzing blur & exposure (parallel)...")
    blurred, exposure = _scan_quality(photo_files, workers=workers)
    print(f"  blurred: {len(blurred)}, exposure issues: {len(exposure)}")

    outputs: dict[str, Path] = {}

    p = reports_dir / REPORT_FILES["duplicate_photos"]
    _write_duplicate_report("Duplicate Photos", dup_photos, photos_base, p, len(photo_files))
    outputs["duplicate_photos"] = p

    p = reports_dir / REPORT_FILES["duplicate_videos"]
    _write_duplicate_report("Duplicate Videos", dup_videos, photos_base, p, len(video_files))
    outputs["duplicate_videos"] = p

    p = reports_dir / REPORT_FILES["screenshots"]
    _write_list_report(
        "Screenshots",
        [(_rel(s[0], photos_base), s[1]) for s in screenshots],
        photos_base,
        p,
        "inbox 中所有 `.png` 文件视为截图/屏幕导出。",
    )
    outputs["screenshots"] = p

    p = reports_dir / REPORT_FILES["live_photos"]
    _write_list_report(
        "Live Photos",
        [
            (f"{_rel(j, photos_base)} + {_rel(m, photos_base)}", "Apple Live Photo 配对")
            for j, m in live_pairs
        ],
        photos_base,
        p,
        "同一主文件名同时存在静态图与视频，通常为 Live Photo。",
    )
    outputs["live_photos"] = p

    p = reports_dir / REPORT_FILES["blurred_photos"]
    _write_quality_report(
        "Blurred Photos",
        [r for r in blurred if "blurred" in r["issues"]],
        photos_base,
        p,
        f"Laplacian 方差 < {BLUR_THRESHOLD}（越低越模糊）",
    )
    outputs["blurred_photos"] = p

    p = reports_dir / REPORT_FILES["exposure_issues"]
    _write_quality_report(
        "Exposure Issues",
        [r for r in exposure if "underexposed" in r["issues"] or "overexposed" in r["issues"]],
        photos_base,
        p,
        f"暗部占比≥{EXPOSURE_DARK_RATIO} 或 亮部占比≥{EXPOSURE_BRIGHT_RATIO}",
    )
    outputs["exposure_issues"] = p

    print("")
    print("Reports written:")
    for path in outputs.values():
        print(f"  {path}")
    return outputs


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Inbox quality audit — report only, no deletes")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    parser.add_argument("--workers", type=int, default=6, help="Parallel workers for blur/exposure")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    run_audit(args.root.resolve(), photo_root_arg=args.photo_root, workers=args.workers)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
