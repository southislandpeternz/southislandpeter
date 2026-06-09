#!/usr/bin/env python3
"""
Organize Kaikoura master photo library under Photos/Kaikoura_MASTER.

Stages copies from scripts/kaikoura-master-sources.json into _originals/ (MD5 dedupe).
Analyzes with OpenCV, classifies into 10 categories, exports best 5–20 per category.
Never deletes or moves source files.
"""

from __future__ import annotations

import argparse
import csv
import fnmatch
import hashlib
import json
import re
import shutil
import subprocess
import sys
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable, Optional

import cv2
import numpy as np

REPO_ROOT = Path(__file__).resolve().parents[1]
SOURCES_JSON = REPO_ROOT / "scripts" / "kaikoura-master-sources.json"
MASTER_ROOT = REPO_ROOT / "Photos" / "Kaikoura_MASTER"
ORIGINALS_DIR = MASTER_ROOT / "_originals"
ORGANIZED_DIR = MASTER_ROOT / "Organized"
FEATURED_DIR = MASTER_ROOT / "Featured"
INDEX_CSV = MASTER_ROOT / "photo_index.csv"
SUMMARY_MD = MASTER_ROOT / "photo_summary.md"

IMAGE_EXT = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".tif", ".tiff",
    ".gif", ".avif", ".dng", ".cr2", ".nef",
}
CONVERT_TO_JPEG_EXT = {".heic", ".heif", ".dng", ".tif", ".tiff", ".cr2", ".nef"}

CATEGORIES = [
    "01-Coastal-Scenery",
    "02-Kaikoura-Peninsula",
    "03-Wildlife",
    "04-Whale-Watching",
    "05-Flight-Experience",
    "06-Fishing-Experience",
    "07-Kaikoura-Town",
    "08-Guest-Experience",
    "09-Photography-Showcase",
    "10-Personal-Archive",
]

MIN_PER_CATEGORY = 5
MAX_PER_CATEGORY = 20
DHASH_HAMMING_DEDUP = 10
BLUR_LAPLACIAN_MIN = 45.0
OVEREXPOSE_BRIGHT_RATIO = 0.38
SHOWCASE_PENINSULA_STEMS = frozenset({
    "kaikkoura-peninsula134",
    "kaikkoura-peninsula135",
    "kaikkoura-peninsula138",
})

# Basename (stem, lower) → primary category folder name.
EXACT_MAPPINGS: dict[str, str] = {
    # Photo Library / Kaikoura-Day-Tour SEO names
    "kaikoura-coastal-rod-father-bay-01": "01-Coastal-Scenery",
    "kaikoura-coastal-scenery-guests-01": "01-Coastal-Scenery",
    "kaikoura-coastal-seals-mountains-01": "01-Coastal-Scenery",
    "whale-watching-aerial-01": "04-Whale-Watching",
    "whale-watching-aerial-02": "04-Whale-Watching",
    "fishing-boat-docked-01": "06-Fishing-Experience",
    "fishing-prep-boarding-01": "06-Fishing-Experience",
    "fishing-trip-at-sea-01": "06-Fishing-Experience",
    "seafood-bbq-lobster-chips-01": "08-Guest-Experience",
    "seafood-bbq-lobster-closeup-01": "08-Guest-Experience",
    "seafood-bbq-lobster-half-01": "08-Guest-Experience",
    "guest-experience-couple-lunch-01": "08-Guest-Experience",
    "guest-experience-group-lunch-01": "08-Guest-Experience",
    "guest-experience-lobster-dining-01": "08-Guest-Experience",
    "wildlife-fur-seal-coast-01": "03-Wildlife",
    "wildlife-fur-seals-peninsula-01": "03-Wildlife",
    "wildlife-seal-colony-walk-01": "03-Wildlife",
    # Site routes & root kaikoura files
    "kajkoura-whale-watch": "04-Whale-Watching",
    "kaikoura-whale-08": "03-Wildlife",
    "kaikoura-01": "01-Coastal-Scenery",
    "kaikoura-02": "03-Wildlife",
    "kaikoura-03": "07-Kaikoura-Town",
    "kaikoura1": "01-Coastal-Scenery",
    "kaikoura2": "01-Coastal-Scenery",
    "kaikoura3": "07-Kaikoura-Town",
    "kaikoura4": "03-Wildlife",
    "kaikoura5": "04-Whale-Watching",
    "kaikoura6": "04-Whale-Watching",
    "kaikoura7": "02-Kaikoura-Peninsula",
    "kaikoura8": "06-Fishing-Experience",
    "kaikoura9": "05-Flight-Experience",
    "kaikoura10": "09-Photography-Showcase",
    # Desktop peninsula showcase picks
    "kaikkoura-peninsula134": "02-Kaikoura-Peninsula",
    "kaikkoura-peninsula135": "02-Kaikoura-Peninsula",
    "kaikkoura-peninsula138": "02-Kaikoura-Peninsula",
}

# (compiled regex on normalized path+name, category, rule id) — first match wins.
PATTERN_RULES: list[tuple[re.Pattern[str], str, str]] = [
    (re.compile(r"kaikoura-flight|/flight/|flight[-_]?experience", re.I), "05-Flight-Experience", "folder-flight"),
    (re.compile(r"kaikouras-whale|whale[-_]?watch|whale-watching|观鲸", re.I), "04-Whale-Watching", "folder-whale"),
    (re.compile(r"kaikoura-peninsula|kaikkoura-peninsula|peninsula", re.I), "02-Kaikoura-Peninsula", "folder-peninsula"),
    (re.compile(r"kaikouras-seal|fur[-_]?seal|seal[-_]?colony|wildlife", re.I), "03-Wildlife", "folder-wildlife"),
    (re.compile(r"kaikoura-coast|kaikkoura-coast|coastal[-_]?scenery", re.I), "01-Coastal-Scenery", "folder-coast"),
    (re.compile(r"fishing|rod[-_]?father|海钓|charter", re.I), "06-Fishing-Experience", "folder-fishing"),
    (re.compile(r"kaikoura-food|seafood|bbq|lobster|crayfish|guest", re.I), "08-Guest-Experience", "folder-guest"),
    (re.compile(r"town|township|main[-_]?street|harbour[-_]?town", re.I), "07-Kaikoura-Town", "folder-town"),
    (re.compile(r"showcase|featured|hero|portfolio", re.I), "09-Photography-Showcase", "folder-showcase"),
    (re.compile(r"personal|archive|private|screenshot|截屏|截图", re.I), "10-Personal-Archive", "folder-personal"),
]


@dataclass
class Analysis:
    path: Path
    stem: str
    md5: str
    width: int = 0
    height: int = 0
    laplacian: float = 0.0
    bright_ratio: float = 0.0
    mean_brightness: float = 0.0
    skin_ratio: float = 0.0
    dhash: str = ""
    score: float = 0.0
    primary_category: str = ""
    extra_categories: list[str] = field(default_factory=list)
    classify_method: str = ""
    issues: list[str] = field(default_factory=list)
    staged_from: str = ""


def md5_file(path: Path) -> str:
    h = hashlib.md5()
    with path.open("rb") as fh:
        for block in iter(lambda: fh.read(1 << 20), b""):
            h.update(block)
    return h.hexdigest()


def hamming(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def dhash_gray(gray: np.ndarray, size: int = 12) -> str:
    img = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA)
    diff = img[:, 1:] > img[:, :-1]
    return "".join("1" if v else "0" for v in diff.flatten())


def skin_ratio(bgr: np.ndarray) -> float:
    b, g, r = cv2.split(bgr)
    cond1 = (r > 55) & (g > 35) & (b > 15) & (r > g) & (g > b) & ((r - g) < 55) & ((g - b) > 8)
    cond2 = (r > 175) & (g > 135) & (b > 100) & (r > g) & (g > b)
    return float((cond1 | cond2).mean())


def load_bgr(path: Path) -> Optional[np.ndarray]:
    data = np.fromfile(str(path), dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if bgr is not None:
        return bgr
    if path.suffix.lower() in CONVERT_TO_JPEG_EXT:
        tmp = path.parent / f".__sips_preview_{path.stem}.jpg"
        try:
            subprocess.run(
                ["sips", "-s", "format", "jpeg", str(path), "--out", str(tmp)],
                check=True,
                capture_output=True,
            )
            data = np.fromfile(str(tmp), dtype=np.uint8)
            bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
        finally:
            tmp.unlink(missing_ok=True)
    return bgr


def analyze_image(path: Path) -> Optional[Analysis]:
    bgr = load_bgr(path)
    if bgr is None:
        return None
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape[:2]
    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    bright = float((gray > 200).mean())
    mean_b = float(gray.mean())
    skin = skin_ratio(bgr)
    dh = dhash_gray(gray)
    try:
        digest = md5_file(path)
    except OSError:
        return None

    issues: list[str] = []
    if lap < BLUR_LAPLACIAN_MIN:
        issues.append("blurred")
    if bright > OVEREXPOSE_BRIGHT_RATIO:
        issues.append("overexposed")

    score = lap * 0.08 + min(w, h) * 0.02
    score -= bright * 120
    if lap < BLUR_LAPLACIAN_MIN:
        score -= 40
    if skin > 0.12:
        score += skin * 80

    return Analysis(
        path=path,
        stem=path.stem.lower(),
        md5=digest,
        width=w,
        height=h,
        laplacian=lap,
        bright_ratio=bright,
        mean_brightness=mean_b,
        skin_ratio=skin,
        dhash=dh,
        score=score,
        issues=issues,
    )


def classify_record(rec: Analysis, source_hint: str = "") -> None:
    stem = rec.stem
    text = f"{source_hint} {rec.path.as_posix()}".lower()

    if stem in EXACT_MAPPINGS:
        rec.primary_category = EXACT_MAPPINGS[stem]
        rec.classify_method = "exact"
    else:
        matched = False
        for pattern, category, rule_id in PATTERN_RULES:
            if pattern.search(text):
                rec.primary_category = category
                rec.classify_method = rule_id
                matched = True
                break
        if not matched:
            if rec.skin_ratio >= 0.18:
                rec.primary_category = "08-Guest-Experience"
                rec.classify_method = "vision-skin"
            elif "blurred" in rec.issues and "overexposed" in rec.issues:
                rec.primary_category = "10-Personal-Archive"
                rec.classify_method = "vision-quality"
            elif rec.laplacian >= 120 and rec.bright_ratio < 0.25:
                rec.primary_category = "09-Photography-Showcase"
                rec.classify_method = "vision-showcase"
            else:
                rec.primary_category = "01-Coastal-Scenery"
                rec.classify_method = "default-coastal"

    if stem in SHOWCASE_PENINSULA_STEMS and "09-Photography-Showcase" not in rec.extra_categories:
        rec.extra_categories.append("09-Photography-Showcase")


def load_sources_config() -> dict:
    with SOURCES_JSON.open(encoding="utf-8") as fh:
        return json.load(fh)


def resolve_source_path(raw: str) -> Path:
    p = Path(raw)
    if p.is_absolute():
        return p
    return (REPO_ROOT / p).resolve()


def iter_source_files(entry: dict) -> Iterable[Path]:
    base = resolve_source_path(entry["path"])
    if not base.exists():
        print(f"  [warn] missing source: {base}", file=sys.stderr)
        return

    if entry.get("files"):
        for name in entry["files"]:
            fp = base / name if base.is_dir() else base.parent / name
            if not fp.is_file() and base.is_file():
                fp = base
            if fp.is_file() and fp.suffix.lower() in IMAGE_EXT:
                yield fp
        return

    glob_pat = entry.get("glob")
    recursive = entry.get("recursive", False)

    if base.is_file():
        if base.suffix.lower() in IMAGE_EXT:
            yield base
        return

    if glob_pat:
        iterator = base.rglob("*") if recursive else base.glob("*")
        for path in iterator:
            if path.is_file() and fnmatch.fnmatch(path.name, glob_pat):
                if path.suffix.lower() in IMAGE_EXT:
                    yield path
        return

    iterator = base.rglob("*") if recursive else base.iterdir()
    for path in iterator:
        if path.is_file() and path.suffix.lower() in IMAGE_EXT:
            yield path


def stage_sources(dry_run: bool = False) -> tuple[int, int, list[str]]:
    cfg = load_sources_config()
    ORIGINALS_DIR.mkdir(parents=True, exist_ok=True)
    seen_md5: dict[str, Path] = {}
    staged = 0
    skipped_dup = 0
    errors: list[str] = []

    for entry in cfg.get("sources", []):
        label = entry.get("label", "source")
        label_dir = ORIGINALS_DIR / label
        if not dry_run:
            label_dir.mkdir(parents=True, exist_ok=True)

        for src in iter_source_files(entry):
            try:
                digest = md5_file(src)
            except OSError as exc:
                errors.append(f"md5 {src}: {exc}")
                continue

            if digest in seen_md5:
                skipped_dup += 1
                continue

            rel_name = src.name
            dest = label_dir / rel_name
            if dest.exists():
                try:
                    if md5_file(dest) == digest:
                        seen_md5[digest] = dest
                        continue
                except OSError:
                    pass
                stem, suf = dest.stem, dest.suffix
                n = 2
                while dest.exists():
                    dest = label_dir / f"{stem}_{n}{suf}"
                    n += 1

            if not dry_run:
                try:
                    shutil.copy2(src, dest)
                except OSError as exc:
                    errors.append(f"copy {src} -> {dest}: {exc}")
                    continue

            seen_md5[digest] = dest
            staged += 1

    return staged, skipped_dup, errors


def list_originals() -> list[Path]:
    if not ORIGINALS_DIR.is_dir():
        return []
    files: list[Path] = []
    for path in ORIGINALS_DIR.rglob("*"):
        if path.is_file() and not path.name.startswith(".") and path.suffix.lower() in IMAGE_EXT:
            files.append(path)
    return sorted(files, key=lambda p: p.name.lower())


def unique_dest_path(folder: Path, name: str) -> Path:
    dest = folder / name
    if not dest.exists():
        return dest
    stem = Path(name).stem
    suffix = Path(name).suffix
    n = 2
    while True:
        candidate = folder / f"{stem}_{n}{suffix}"
        if not candidate.exists():
            return candidate
        n += 1


def export_organized_copy(src: Path, dest: Path, dry_run: bool) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    out = dest
    if src.suffix.lower() in CONVERT_TO_JPEG_EXT:
        out = dest.with_suffix(".jpg")
    if dry_run:
        return
    if src.suffix.lower() in CONVERT_TO_JPEG_EXT:
        subprocess.run(
            ["sips", "-s", "format", "jpeg", str(src), "--out", str(out)],
            check=True,
            capture_output=True,
        )
    else:
        shutil.copy2(src, out)


def select_for_category(items: list[Analysis]) -> list[Analysis]:
    ranked = sorted(items, key=lambda r: (r.score, r.laplacian, r.width * r.height), reverse=True)
    picked: list[Analysis] = []
    seen_dhash: list[str] = []
    for rec in ranked:
        if rec.dhash and any(hamming(rec.dhash, h) < DHASH_HAMMING_DEDUP for h in seen_dhash):
            continue
        picked.append(rec)
        if rec.dhash:
            seen_dhash.append(rec.dhash)
        if len(picked) >= MAX_PER_CATEGORY:
            break
    if len(picked) < MIN_PER_CATEGORY:
        for rec in ranked:
            if rec in picked:
                continue
            picked.append(rec)
            if len(picked) >= MIN_PER_CATEGORY:
                break
    return picked


def organize_library(dry_run: bool = False) -> tuple[dict[str, int], list[str]]:
    files = list_originals()
    if not files:
        print("No files in _originals; run with --stage first.")
        return {}, ["no originals"]

    records: list[Analysis] = []
    errors: list[str] = []
    for path in files:
        hint = str(path.relative_to(ORIGINALS_DIR)) if path.is_relative_to(ORIGINALS_DIR) else path.name
        rec = analyze_image(path)
        if rec is None:
            errors.append(f"analyze failed: {path}")
            continue
        rec.staged_from = hint
        classify_record(rec, source_hint=hint)
        records.append(rec)

    by_category: dict[str, list[Analysis]] = defaultdict(list)
    for rec in records:
        by_category[rec.primary_category].append(rec)
        for extra in rec.extra_categories:
            by_category[extra].append(rec)

    for cat in CATEGORIES:
        (ORGANIZED_DIR / cat).mkdir(parents=True, exist_ok=True)
    FEATURED_DIR.mkdir(parents=True, exist_ok=True)

    organized_counts: dict[str, int] = {c: 0 for c in CATEGORIES}
    index_rows: list[dict[str, str]] = []
    featured_picks: list[Analysis] = []

    showcase_forced = [r for r in records if r.stem in SHOWCASE_PENINSULA_STEMS]
    for rec in showcase_forced:
        if rec not in by_category.get("09-Photography-Showcase", []):
            by_category["09-Photography-Showcase"].append(rec)

    for cat in CATEGORIES:
        picks = select_for_category(by_category.get(cat, []))
        if cat == "09-Photography-Showcase":
            for rec in showcase_forced:
                if all(rec.md5 != p.md5 for p in picks):
                    picks.append(rec)
        for rec in picks:
            out_name = rec.path.name
            if rec.path.suffix.lower() in CONVERT_TO_JPEG_EXT:
                out_name = f"{rec.path.stem}.jpg"
            dest = ORGANIZED_DIR / cat / out_name
            try:
                export_organized_copy(rec.path, dest, dry_run)
            except (OSError, subprocess.CalledProcessError) as exc:
                errors.append(f"export {rec.path} -> {dest}: {exc}")
                continue
            organized_counts[cat] += 1
            index_rows.append({
                "category": cat,
                "filename": dest.name,
                "source": rec.staged_from,
                "md5": rec.md5,
                "score": f"{rec.score:.2f}",
                "laplacian": f"{rec.laplacian:.1f}",
                "bright_ratio": f"{rec.bright_ratio:.3f}",
                "skin_ratio": f"{rec.skin_ratio:.3f}",
                "dhash": rec.dhash,
                "method": rec.classify_method,
                "issues": ";".join(rec.issues),
            })
            if cat != "10-Personal-Archive" and rec.score >= 50:
                featured_picks.append(rec)

    by_md5: dict[str, Analysis] = {}
    for rec in featured_picks:
        by_md5.setdefault(rec.md5, rec)
    featured_picks = sorted(by_md5.values(), key=lambda r: r.score, reverse=True)[:15]
    for rec in featured_picks:
        out_name = rec.path.name
        if rec.path.suffix.lower() in CONVERT_TO_JPEG_EXT:
            out_name = f"{rec.path.stem}.jpg"
        dest = FEATURED_DIR / out_name
        try:
            export_organized_copy(rec.path, dest, dry_run)
        except (OSError, subprocess.CalledProcessError) as exc:
            errors.append(f"featured {rec.path}: {exc}")

    if not dry_run:
        write_index(index_rows, organized_counts, len(files), errors)
    else:
        print("(dry-run — no organized copies written)")

    return organized_counts, errors


def write_index(
    rows: list[dict[str, str]],
    organized_counts: dict[str, int],
    staged_total: int,
    errors: list[str],
) -> None:
    MASTER_ROOT.mkdir(parents=True, exist_ok=True)
    fieldnames = [
        "category", "filename", "source", "md5", "score", "laplacian",
        "bright_ratio", "skin_ratio", "dhash", "method", "issues",
    ]
    with INDEX_CSV.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    lines = [
        "# Kaikoura MASTER — Photo Summary",
        "",
        f"Generated: {datetime.now(timezone.utc).isoformat()}",
        "",
        "## Staging",
        f"- Originals scanned: **{staged_total}** files under `{ORIGINALS_DIR.relative_to(REPO_ROOT)}`",
        "",
        "## Organized counts (5–20 per category, dhash deduped)",
        "",
        "| Category | Count |",
        "| --- | ---: |",
    ]
    total_org = 0
    for cat in CATEGORIES:
        n = organized_counts.get(cat, 0)
        total_org += n
        lines.append(f"| {cat} | {n} |")
    lines.extend([
        f"| **Total** | **{total_org}** |",
        "",
        "## Outputs",
        f"- Index: `{INDEX_CSV.relative_to(REPO_ROOT)}`",
        f"- Organized: `{ORGANIZED_DIR.relative_to(REPO_ROOT)}/`",
        f"- Featured: `{FEATURED_DIR.relative_to(REPO_ROOT)}/`",
        "",
    ])
    if errors:
        lines.append("## Errors")
        for err in errors[:50]:
            lines.append(f"- {err}")
        if len(errors) > 50:
            lines.append(f"- … and {len(errors) - 50} more")
        lines.append("")

    SUMMARY_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description="Stage and organize Kaikoura MASTER photos")
    parser.add_argument("--stage", action="store_true", help="Copy sources into _originals only")
    parser.add_argument("--dry-run", action="store_true", help="Do not write copies")
    args = parser.parse_args()

    if args.stage:
        staged, skipped_dup, errors = stage_sources(dry_run=args.dry_run)
        print(f"Staged: {staged} new copies (skipped {skipped_dup} MD5 duplicates)")
        for err in errors:
            print(f"  error: {err}", file=sys.stderr)
        if args.dry_run:
            print("(dry-run — staging not written)")
        if not args.dry_run and not errors:
            return 0
        return 0 if not errors else 1

    originals = list_originals()
    organized_counts, errors = organize_library(dry_run=args.dry_run)
    print("Organized per category:")
    for cat in CATEGORIES:
        print(f"  {cat}: {organized_counts.get(cat, 0)}")
    print(f"Originals pool: {len(originals)}")
    if not args.dry_run:
        print(f"Index: {INDEX_CSV}")
        print(f"Summary: {SUMMARY_MD}")
    for err in errors:
        print(f"  error: {err}", file=sys.stderr)
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
