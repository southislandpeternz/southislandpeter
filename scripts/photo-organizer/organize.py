#!/usr/bin/env python3
"""
AI Photo Organizer — read inbox photos, recognize content, copy to category folders.

Originals always stay in place. Uncertain photos are not moved or copied.
"""

from __future__ import annotations

import argparse
import shutil
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from classifiers import ClassificationResult  # noqa: E402
from vision_classify import classify_photo_vision  # noqa: E402
from config import (  # noqa: E402
    ALL_TARGETS,
    CONFIDENCE_THRESHOLD,
    INBOX_DIR,
    PHOTO_ROOT,
    REPORTS_DIR,
    UNSORTED_DIR,
)
from inbox_scan import scan_inbox  # noqa: E402
from library_paths import discover_photo_root, resolve_folder_path  # noqa: E402
from report import FileRecord, OrganizeReport, write_report  # noqa: E402


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def resolve_photo_root(root: Path, photo_root_arg: Path | None = None) -> Path:
    if photo_root_arg is not None:
        return photo_root_arg.resolve()
    root = root.resolve()
    if root.name.strip() == PHOTO_ROOT.strip() and (root / INBOX_DIR).is_dir():
        return root
    return discover_photo_root(root, scan_inbox)


def resolve_repo_root(root: Path, photo_root_path: Path) -> Path:
    root = root.resolve()
    photo_root_path = photo_root_path.resolve()
    try:
        photo_root_path.relative_to(root)
        return root
    except ValueError:
        pass
    if root.name.strip() == PHOTO_ROOT.strip():
        return root.parent
    return root


def report_base(repo_base: Path, photos_base: Path) -> Path:
    try:
        photos_base.relative_to(repo_base)
        return repo_base
    except ValueError:
        return photos_base


def photo_root(root: Path, photo_root_arg: Path | None = None) -> Path:
    return resolve_photo_root(root, photo_root_arg)


def ensure_directories(root: Path, photo_root_arg: Path | None = None) -> None:
    base = photo_root(root, photo_root_arg)
    dirs = {INBOX_DIR, UNSORTED_DIR, REPORTS_DIR}
    dirs.update(t.folder for t in ALL_TARGETS.values())
    for name in sorted(dirs):
        (base / name).mkdir(parents=True, exist_ok=True)
    print(f"Initialized directories under {base}/")


def unique_destination(dest: Path) -> Path:
    if not dest.exists():
        return dest
    stem, suffix = dest.stem, dest.suffix
    counter = 2
    while True:
        candidate = dest.with_name(f"{stem}_{counter}{suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def is_classified(result: ClassificationResult) -> bool:
    return bool(
        result.target_id
        and result.confidence >= CONFIDENCE_THRESHOLD
        and result.method not in ("none", "ambiguous")
    )


def collect_sources(photos_base: Path, source_names: list[str]) -> list[Path]:
    files: list[Path] = []
    for name in source_names:
        folder = photos_base / name
        scan = scan_inbox(folder)
        files.extend(scan.images)
    return sorted(set(files))


def organize(
    root: Path,
    photo_root_arg: Path | None = None,
    dry_run: bool = False,
    source_names: list[str] | None = None,
    vision_only: bool = False,
    report_name: str | None = None,
) -> OrganizeReport:
    photos_base = photo_root(root, photo_root_arg)
    repo_base = resolve_repo_root(root, photos_base)
    rbase = report_base(repo_base, photos_base)
    reports_dir = photos_base / REPORTS_DIR

    if source_names is None:
        source_names = [INBOX_DIR, UNSORTED_DIR]

    files = collect_sources(photos_base, source_names)
    inbox_display = ", ".join(str(photos_base / n) for n in source_names)

    print(f"Photo library: {photos_base}")
    print(f"Scan dirs: {inbox_display}")
    print(f"  images to recognize: {len(files)}")
    if vision_only:
        print("  mode: vision-only (thumbnail / AI, no GPS)")

    classify_fn = classify_photo_vision if vision_only else None
    if classify_fn is None:
        from classifiers import classify_photo as classify_fn  # noqa: E402

    records: list[FileRecord] = []
    by_folder: dict[str, int] = {}
    by_label: dict[str, int] = {}
    copied = skipped = errors = 0

    for src in files:
        try:
            result = classify_fn(src)
            src_rel = str(src)
            try:
                src_rel = str(src.relative_to(rbase))
            except ValueError:
                pass

            if not is_classified(result):
                skipped += 1
                records.append(
                    FileRecord(
                        source=src_rel,
                        destination=src_rel,
                        target_id=result.target_id,
                        folder=None,
                        label=result.label,
                        confidence=result.confidence,
                        method=result.method,
                        action="skipped",
                        gps=list(result.gps) if result.gps else None,
                        signals=[asdict(s) for s in result.signals],
                    )
                )
                continue

            dest_dir = resolve_folder_path(photos_base, ALL_TARGETS[result.target_id].folder)
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = unique_destination(dest_dir / src.name)
            dest_rel = str(dest)
            try:
                dest_rel = str(dest.relative_to(rbase))
            except ValueError:
                pass

            label = result.label or ALL_TARGETS[result.target_id].label
            folder_key = ALL_TARGETS[result.target_id].folder
            by_folder[folder_key] = by_folder.get(folder_key, 0) + 1
            by_label[label] = by_label.get(label, 0) + 1
            copied += 1

            if not dry_run:
                shutil.copy2(str(src), str(dest))

            records.append(
                FileRecord(
                    source=src_rel,
                    destination=dest_rel,
                    target_id=result.target_id,
                    folder=folder_key,
                    label=label,
                    confidence=result.confidence,
                    method=result.method,
                    action="copied",
                    gps=list(result.gps) if result.gps else None,
                    signals=[asdict(s) for s in result.signals],
                )
            )
        except Exception as exc:  # noqa: BLE001
            errors += 1
            src_rel = str(src)
            try:
                src_rel = str(src.relative_to(rbase))
            except ValueError:
                pass
            records.append(
                FileRecord(
                    source=src_rel,
                    destination=src_rel,
                    target_id=None,
                    folder=None,
                    label=None,
                    confidence=0.0,
                    method="error",
                    action="error",
                    error=str(exc),
                )
            )

    mode = "vision-only（缩略图视觉识别，不依赖 GPS）" if vision_only else "copy（原图保留，无法确定不移动）"
    report = OrganizeReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        inbox=inbox_display,
        mode=mode,
        dry_run=dry_run,
        total=len(files),
        copied=copied,
        skipped=skipped,
        errors=errors,
        by_folder=by_folder,
        by_label=by_label,
        files=records,
    )

    json_path, md_path = write_report(report, reports_dir, fixed_name=report_name)
    print("")
    print(f"Scanned: {report.total} | Copied: {report.copied} | Skipped: {report.skipped} | Errors: {report.errors}")
    print(f"Report JSON: {json_path}")
    print(f"Report Markdown: {md_path}")
    if dry_run:
        print("(dry-run — no files were copied)")
    else:
        print("(原图保留在原位，仅复制已识别照片到对应文件夹)")
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="AI Photo Organizer — recognize & copy")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    parser.add_argument("--init-dirs", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--sources",
        nargs="+",
        default=[INBOX_DIR, UNSORTED_DIR],
        help="Folders to scan (default: inbox unsorted)",
    )
    parser.add_argument(
        "--vision-only",
        action="store_true",
        help="Use thumbnail/AI vision only; skip GPS",
    )
    parser.add_argument(
        "--report-name",
        type=str,
        default=None,
        help="Fixed report filename, e.g. recognize-report.md",
    )
    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    root: Path = args.root.resolve()
    photo_root_arg: Path | None = args.photo_root.resolve() if args.photo_root else None

    if args.init_dirs:
        ensure_directories(root, photo_root_arg)

    photos_base = photo_root(root, photo_root_arg)
    if not (photos_base / INBOX_DIR).exists():
        ensure_directories(root, photo_root_arg)

    organize(
        root,
        photo_root_arg=photo_root_arg,
        dry_run=args.dry_run,
        source_names=args.sources,
        vision_only=args.vision_only,
        report_name=args.report_name,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
