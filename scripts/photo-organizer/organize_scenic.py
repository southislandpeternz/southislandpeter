#!/usr/bin/env python3
"""Organize inbox photos into Chinese scenic spot folders — copy only, no deletes."""

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

from config import (  # noqa: E402
    CONFIDENCE_THRESHOLD,
    INBOX_DIR,
    REPORTS_DIR,
    SCENIC_REPORT_NAME,
    SCENIC_SPOTS,
    UNSORTED_DIR,
)
from inbox_scan import scan_inbox  # noqa: E402
from library_paths import discover_photo_root, resolve_folder_path  # noqa: E402
from organize import (  # noqa: E402
    photo_root,
    report_base,
    repo_root,
    resolve_repo_root,
    unique_destination,
)
from report import FileRecord, OrganizeReport, write_report  # noqa: E402
from scenic_classify import classify_photo_scenic  # noqa: E402


def ensure_scenic_dirs(photos_base: Path) -> None:
    for target in SCENIC_SPOTS.values():
        (photos_base / target.folder).mkdir(parents=True, exist_ok=True)
    (photos_base / UNSORTED_DIR).mkdir(parents=True, exist_ok=True)
    (photos_base / REPORTS_DIR).mkdir(parents=True, exist_ok=True)


def collect_photos(photos_base: Path, source_names: list[str]) -> list[Path]:
    files: list[Path] = []
    for name in source_names:
        folder = photos_base / name
        scan = scan_inbox(folder)
        for p in scan.images:
            if p.suffix.lower() == ".png":
                continue
            files.append(p)
    return sorted(set(files))


def organize_scenic(
    root: Path,
    photo_root_arg: Path | None = None,
    dry_run: bool = False,
    source_names: list[str] | None = None,
) -> OrganizeReport:
    photos_base = photo_root(root, photo_root_arg)
    repo_base = resolve_repo_root(root, photos_base)
    rbase = report_base(repo_base, photos_base)
    reports_dir = photos_base / REPORTS_DIR

    ensure_scenic_dirs(photos_base)

    if source_names is None:
        source_names = [INBOX_DIR]

    files = collect_photos(photos_base, source_names)
    scan_display = ", ".join(str(photos_base / n) for n in source_names)

    print(f"Photo library: {photos_base}")
    print(f"Scan dirs: {scan_display}")
    print(f"  photos to classify: {len(files)}")
    print("  mode: scenic spots (vision + GPS + filename, copy only)")

    records: list[FileRecord] = []
    by_folder: dict[str, int] = {}
    by_label: dict[str, int] = {}
    copied = skipped = errors = 0

    for i, src in enumerate(files, 1):
        if i % 200 == 0:
            print(f"  progress: {i}/{len(files)}", flush=True)
        try:
            result = classify_photo_scenic(src)
            src_rel = str(src)
            try:
                src_rel = str(src.relative_to(rbase))
            except ValueError:
                pass

            classified = bool(
                result.target_id
                and result.confidence >= CONFIDENCE_THRESHOLD
                and result.method not in ("none", "ambiguous", "vision_uncertain")
            )

            if not classified:
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

            dest_dir = resolve_folder_path(photos_base, SCENIC_SPOTS[result.target_id].folder)
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = unique_destination(dest_dir / src.name)
            dest_rel = str(dest)
            try:
                dest_rel = str(dest.relative_to(rbase))
            except ValueError:
                pass

            label = result.label or SCENIC_SPOTS[result.target_id].label
            folder_key = SCENIC_SPOTS[result.target_id].folder
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

    report = OrganizeReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        inbox=scan_display,
        mode="景点分类（复制到中文文件夹，原图保留，不删除）",
        dry_run=dry_run,
        total=len(files),
        copied=copied,
        skipped=skipped,
        errors=errors,
        by_folder=by_folder,
        by_label=by_label,
        files=records,
    )

    json_path, md_path = write_report(report, reports_dir, fixed_name=SCENIC_REPORT_NAME)
    _write_scenic_summary_header(md_path, report)
    print("")
    print(f"Scanned: {report.total} | Copied: {report.copied} | Skipped: {report.skipped} | Errors: {report.errors}")
    print(f"Report: {md_path}")
    return report


def _write_scenic_summary_header(md_path: Path, report: OrganizeReport) -> None:
    body = md_path.read_text(encoding="utf-8")
    header = [
        "# 景点分类统计报告 scenic-classify-report",
        "",
        f"- 生成时间 (UTC): {report.generated_at}",
        f"- 扫描目录: `{report.inbox}`",
        f"- 模式: {report.mode}",
        f"- 扫描照片: **{report.total}** 张（不含 PNG 截图）",
        f"- 已分类复制: **{report.copied}** 张",
        f"- 未识别（仍在原位）: **{report.skipped}** 张",
        f"- 错误: **{report.errors}** 张",
        "",
        "> 未删除任何照片；仅复制到景点文件夹，原图仍在 inbox。",
        "",
        "## 景点文件夹统计",
        "",
        "| 景点文件夹 | 数量 |",
        "|------------|------|",
    ]
    for tid in SCENIC_SPOTS:
        folder = SCENIC_SPOTS[tid].folder
        header.append(f"| {folder} | {report.by_folder.get(folder, 0)} |")
    if report.skipped:
        header.append(f"| 未分类（保留 inbox） | {report.skipped} |")
    header.extend(["", "---", ""])
    if body.startswith("# 照片识别报告"):
        body = body.split("## 分类数量统计", 1)[-1]
        body = "## 分类数量统计" + body
    md_path.write_text("\n".join(header) + "\n" + body, encoding="utf-8")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Classify photos into scenic Chinese folders")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sources", nargs="+", default=[INBOX_DIR])
    return parser


def main() -> int:
    args = build_parser().parse_args()
    organize_scenic(
        args.root.resolve(),
        photo_root_arg=args.photo_root.resolve() if args.photo_root else None,
        dry_run=args.dry_run,
        source_names=args.sources,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
