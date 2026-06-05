#!/usr/bin/env python3
"""Re-scan classification folders and report suspected misclassifications."""

from __future__ import annotations

import argparse
import json
import sys
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from config import ALL_TARGETS, CATEGORIES, INBOX_DIR, PHOTO_ROOT, REGIONS, REPORTS_DIR, UNSORTED_DIR  # noqa: E402
from inbox_scan import scan_inbox  # noqa: E402
from library_paths import discover_photo_root  # noqa: E402
from vision import _label_for, analyze_details, audit_assignment  # noqa: E402

RESERVED_DIRS = {INBOX_DIR, UNSORTED_DIR, REPORTS_DIR, ".git"}
REPORT_NAME = "accuracy-report.md"
THEME_FOLDERS = {t.folder for t in CATEGORIES.values()}


@dataclass
class AuditRecord:
    file: str
    current_folder: str
    current_label: str
    people_count: int
    assigned_score: float
    suggested_label: str | None
    reasons: list[str] = field(default_factory=list)


@dataclass
class AccuracyReport:
    generated_at: str
    photo_library: str
    total_scanned: int
    suspected_count: int
    by_folder: dict[str, int] = field(default_factory=dict)
    records: list[AuditRecord] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def folder_to_target_id(folder_name: str) -> str | None:
    key = folder_name.strip().lower()
    for tid, target in ALL_TARGETS.items():
        if target.folder.strip().lower() == key or target.label.strip().lower() == key:
            return tid
    aliases = {
        "lake-tekapo": "lake-tekapo",
        "lake tekapo": "lake-tekapo",
        "mount-cook": "mount-cook",
        "mount cook": "mount-cook",
        "milford-sound": "milford-sound",
        "milford sound": "milford-sound",
        "moeraki-boulders": "moeraki-boulders",
        "moeraki boulders": "moeraki-boulders",
        "hanmer-springs": "hanmer-springs",
        "kaikoura": "kaikoura",
        "akaroa": "akaroa",
        "wanaka": "wanaka",
        "queenstown": "queenstown",
        "christchurch": "christchurch",
        "dunedin": "dunedin",
    }
    return aliases.get(key)


def classification_directories(photos_base: Path) -> list[Path]:
    dirs: list[Path] = []
    for entry in photos_base.iterdir():
        if not entry.is_dir():
            continue
        if entry.name in RESERVED_DIRS or entry.name.startswith("."):
            continue
        if folder_to_target_id(entry.name) is None:
            continue
        dirs.append(entry)
    return sorted(dirs, key=lambda p: p.name.lower())


def _format_record(rec: AuditRecord) -> list[str]:
    lines = [
        f"#### `{Path(rec.file).name}`",
        "",
        f"- 当前目录: **{rec.current_label}** (`{rec.current_folder}`)",
        f"- 检测人数: {rec.people_count}",
        f"- 当前类置信: {rec.assigned_score:.2f}",
    ]
    if rec.suggested_label:
        lines.append(f"- 建议分类: **{rec.suggested_label}**")
    lines.append("- 原因:")
    for reason in rec.reasons:
        lines.append(f"  - {reason}")
    lines.append("")
    return lines


def render_markdown(report: AccuracyReport) -> str:
    theme_names = ("客人合影", "美食", "奔驰商务车", "酒店民宿", "星空")
    theme_suspected = [r for r in report.records if r.reasons and r.current_folder in theme_names]
    theme_totals = {name: sum(1 for r in report.records if r.current_folder == name) for name in theme_names}

    lines = [
        "# 分类准确率审计 accuracy-report",
        "",
        f"- 生成时间 (UTC): {report.generated_at}",
        f"- 照片库: `{report.photo_library}`",
        f"- 扫描分类目录: **{report.total_scanned}** 张",
        f"- 疑似分类错误: **{report.suspected_count}** 张",
        "",
        "## 主题分类目录审计",
        "",
        "| 目录 | 总数 | 疑似错误 |",
        "|------|------|----------|",
    ]
    for name in theme_names:
        total = theme_totals.get(name, 0)
        sus = sum(1 for r in theme_suspected if r.current_folder == name)
        if total:
            lines.append(f"| {name} | {total} | {sus} |")

    lines.extend([
        "",
        "## 各目录疑似错误数量",
        "",
        "| 当前目录 | 疑似错误 |",
        "|----------|----------|",
    ])
    for folder, count in sorted(report.by_folder.items(), key=lambda x: (-x[1], x[0])):
        if count:
            lines.append(f"| `{folder}` | {count} |")

    lines.extend(["", "## 疑似分类错误明细", ""])

    suspected = [r for r in report.records if r.reasons]
    theme_first = [r for r in suspected if r.current_folder in theme_names]
    other = [r for r in suspected if r.current_folder not in theme_names]

    if theme_first:
        lines.append("### 主题分类（优先检查）")
        lines.append("")
        for rec in theme_first:
            lines.extend(_format_record(rec))
    if other:
        lines.append("### 地区分类")
        lines.append("")
        for rec in other:
            lines.extend(_format_record(rec))
    if not suspected:
        lines.append("_未发现疑似错误_")

    lines.extend([
        "",
        "## 分类规则（本次审计依据）",
        "",
        "| 类别 | 规则 |",
        "|------|------|",
        "| 客人合影 | 至少 2 人以上，人物为主体 |",
        "| 美食 | 食物为画面主体 |",
        "| 奔驰商务车 | 车辆为画面主体 |",
        "| 酒店民宿 | 房间/室内为主体 |",
        "| 风景 | 无明显人物主体 |",
    ])
    return "\n".join(lines).rstrip() + "\n"


def write_report(report: AccuracyReport, reports_dir: Path) -> tuple[Path, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    md_path = reports_dir / REPORT_NAME
    json_path = reports_dir / REPORT_NAME.replace(".md", ".json")
    md_path.write_text(render_markdown(report), encoding="utf-8")
    json_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return md_path, json_path


def run_audit(root: Path, photo_root_arg: Path | None = None) -> AccuracyReport:
    photos_base = photo_root_arg.resolve() if photo_root_arg else discover_photo_root(root, scan_inbox)
    records: list[AuditRecord] = []
    by_folder: dict[str, int] = {}
    total = 0

    for folder in classification_directories(photos_base):
        target_id = folder_to_target_id(folder.name)
        if not target_id:
            continue
        current_label = ALL_TARGETS[target_id].label if target_id in ALL_TARGETS else folder.name
        images = scan_inbox(folder).images

        for path in images:
            total += 1
            details = analyze_details(path)
            scores = details.get("scores", {})
            assigned_score = scores.get(target_id, 0.0)
            reasons, suggested_id = audit_assignment(target_id, details)
            suggested_label = _label_for(suggested_id) if suggested_id else None

            rel = str(path.relative_to(photos_base))
            rec = AuditRecord(
                file=rel,
                current_folder=folder.name,
                current_label=current_label,
                people_count=details.get("people_count", 0),
                assigned_score=assigned_score,
                suggested_label=suggested_label,
                reasons=reasons,
            )
            records.append(rec)
            if reasons:
                by_folder[folder.name] = by_folder.get(folder.name, 0) + 1

    report = AccuracyReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        photo_library=str(photos_base),
        total_scanned=total,
        suspected_count=sum(1 for r in records if r.reasons),
        by_folder=by_folder,
        records=records,
    )
    md_path, json_path = write_report(report, photos_base / REPORTS_DIR)
    print(f"Photo library: {photos_base}")
    print(f"Scanned: {report.total_scanned} | Suspected errors: {report.suspected_count}")
    print(f"Report: {md_path}")
    print(f"JSON: {json_path}")
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Audit classification accuracy in category folders")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    return parser


def main() -> int:
    args = build_parser().parse_args()
    run_audit(args.root.resolve(), photo_root_arg=args.photo_root)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
