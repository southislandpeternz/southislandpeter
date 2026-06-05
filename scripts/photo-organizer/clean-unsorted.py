#!/usr/bin/env python3
"""Remove unsorted photos that already exist in classification folders."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import INBOX_DIR, PHOTO_ROOT, REPORTS_DIR, UNSORTED_DIR  # noqa: E402
from inbox_scan import scan_inbox  # noqa: E402
from library_paths import discover_photo_root  # noqa: E402

RESERVED_DIRS = {INBOX_DIR, UNSORTED_DIR, REPORTS_DIR, ".git"}
REPORT_NAME = "clean-unsorted-report.md"


@dataclass
class CleanRecord:
    source: str
    matched_in: str | None
    action: str  # deleted | kept | error
    error: str | None = None


@dataclass
class CleanReport:
    generated_at: str
    photo_library: str
    dry_run: bool
    total: int
    deleted: int
    kept: int
    errors: int
    records: list[CleanRecord] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def classification_directories(photos_base: Path) -> list[Path]:
    dirs: list[Path] = []
    for entry in photos_base.iterdir():
        if not entry.is_dir():
            continue
        if entry.name in RESERVED_DIRS or entry.name.startswith("."):
            continue
        dirs.append(entry)
    return sorted(dirs)


def list_category_files(category_dirs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for folder in category_dirs:
        for entry in folder.iterdir():
            if entry.is_file() and not entry.name.startswith("."):
                files.append(entry)
    return files


def find_category_match(filename: str, category_files: list[Path]) -> Path | None:
    stem = Path(filename).stem
    suffix = Path(filename).suffix
    variant = re.compile(re.escape(stem) + r"(?:_\d+)?" + re.escape(suffix) + "$", re.IGNORECASE)

    for cat_file in category_files:
        if cat_file.name.lower() == filename.lower():
            return cat_file
        if variant.match(cat_file.name):
            return cat_file
    return None


def render_markdown(report: CleanReport) -> str:
    lines = [
        "# unsorted 清理报告 clean-unsorted-report",
        "",
        f"- 生成时间 (UTC): {report.generated_at}",
        f"- 照片库: `{report.photo_library}`",
        f"- 模式: {'预览 (dry-run)' if report.dry_run else '已删除'}",
        f"- 扫描 unsorted: **{report.total}** 张",
        f"- 已删除: **{report.deleted}** 张（分类目录中已有副本）",
        f"- 保留: **{report.kept}** 张（未分类 / 无匹配）",
        f"- 错误: **{report.errors}** 张",
        "",
        "## 已删除",
        "",
    ]

    deleted = [r for r in report.records if r.action == "deleted"]
    if deleted:
        lines.extend(["| 原文件 | 匹配分类副本 |", "|--------|--------------|"])
        for rec in deleted:
            lines.append(f"| `{Path(rec.source).name}` | `{rec.matched_in}` |")
    else:
        lines.append("_无_")

    lines.extend(["", "## 保留（未分类）", ""])
    kept = [r for r in report.records if r.action == "kept"]
    if kept:
        for rec in kept:
            lines.append(f"- `{Path(rec.source).name}`")
    else:
        lines.append("_无_")

    if report.errors:
        lines.extend(["", "## 错误", ""])
        for rec in report.records:
            if rec.action == "error":
                lines.append(f"- `{rec.source}`: {rec.error}")

    return "\n".join(lines).rstrip() + "\n"


def write_report(report: CleanReport, reports_dir: Path) -> tuple[Path, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    md_path = reports_dir / REPORT_NAME
    json_path = reports_dir / REPORT_NAME.replace(".md", ".json")
    md_path.write_text(render_markdown(report), encoding="utf-8")
    json_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return md_path, json_path


def clean_unsorted(
    root: Path,
    photo_root_arg: Path | None = None,
    dry_run: bool = False,
) -> CleanReport:
    photos_base = photo_root_arg.resolve() if photo_root_arg else discover_photo_root(root, scan_inbox)
    unsorted_dir = photos_base / UNSORTED_DIR
    if not unsorted_dir.is_dir():
        raise FileNotFoundError(f"unsorted folder not found: {unsorted_dir}")

    category_dirs = classification_directories(photos_base)
    category_files = list_category_files(category_dirs)
    unsorted_files = scan_inbox(unsorted_dir).images

    records: list[CleanRecord] = []
    deleted = kept = errors = 0

    for src in unsorted_files:
        src_rel = str(src.relative_to(photos_base))
        try:
            match = find_category_match(src.name, category_files)
            if match is None:
                kept += 1
                records.append(CleanRecord(source=src_rel, matched_in=None, action="kept"))
                continue

            matched_rel = str(match.relative_to(photos_base))
            if not dry_run:
                src.unlink()

            deleted += 1
            records.append(CleanRecord(source=src_rel, matched_in=matched_rel, action="deleted"))
        except OSError as exc:
            errors += 1
            records.append(CleanRecord(source=src_rel, matched_in=None, action="error", error=str(exc)))

    report = CleanReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        photo_library=str(photos_base),
        dry_run=dry_run,
        total=len(unsorted_files),
        deleted=deleted,
        kept=kept,
        errors=errors,
        records=records,
    )
    md_path, json_path = write_report(report, photos_base / REPORTS_DIR)
    print(f"Photo library: {photos_base}")
    print(f"Scanned unsorted: {report.total}")
    print(f"Deleted: {report.deleted} | Kept: {report.kept} | Errors: {report.errors}")
    print(f"Report: {md_path}")
    print(f"JSON: {json_path}")
    if dry_run:
        print("(dry-run — no files were deleted)")
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Remove unsorted photos already copied to category folders")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true", help="Preview deletions without removing files")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    clean_unsorted(args.root.resolve(), photo_root_arg=args.photo_root, dry_run=args.dry_run)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
