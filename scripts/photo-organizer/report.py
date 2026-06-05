"""Write JSON and Markdown classification reports."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional


@dataclass
class FileRecord:
    source: str
    destination: str
    target_id: Optional[str]
    folder: Optional[str]
    label: Optional[str]
    confidence: float
    method: str
    action: str  # copied | skipped | error
    gps: Optional[List[float]] = None
    signals: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None


@dataclass
class OrganizeReport:
    generated_at: str
    inbox: str
    mode: str
    dry_run: bool
    total: int
    copied: int
    skipped: int
    errors: int
    by_folder: Dict[str, int] = field(default_factory=dict)
    by_label: Dict[str, int] = field(default_factory=dict)
    files: List[FileRecord] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def write_report(report: OrganizeReport, reports_dir: Path, fixed_name: str | None = None) -> tuple[Path, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    if fixed_name:
        md_path = reports_dir / fixed_name
        json_path = reports_dir / fixed_name.replace(".md", ".json")
    else:
        json_path = reports_dir / f"recognize-{stamp}.json"
        md_path = reports_dir / f"recognize-{stamp}.md"

    json_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    md_path.write_text(_render_summary_report(report), encoding="utf-8")
    return json_path, md_path


def _render_summary_report(report: OrganizeReport) -> str:
    """recognize-report.md — category counts first."""
    lines = [
        "# 照片识别报告 recognize-report",
        "",
        f"- 生成时间 (UTC): {report.generated_at}",
        f"- 扫描目录: `{report.inbox}`",
        f"- 识别方式: {report.mode}",
        f"- 扫描总数: **{report.total}** 张",
        f"- 已识别: **{report.copied}** 张",
        f"- 未分类: **{report.skipped}** 张",
        f"- 错误: **{report.errors}** 张",
        "",
        "## 分类数量统计",
        "",
        "| 分类 | 数量 |",
        "|------|------|",
    ]

    # Ensure all labels appear including 未分类
    counts = dict(report.by_label)
    if report.skipped:
        counts["未分类"] = report.skipped

    for label, count in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
        lines.append(f"| {label} | {count} |")

    lines.extend([
        "",
        "## 主题分类（客人合影 / 奔驰商务车 / 酒店民宿 / 美食 / 星空）",
        "",
        "| 主题 | 数量 |",
        "|------|------|",
    ])
    theme_labels = ("客人合影", "奔驰商务车", "酒店民宿", "美食", "星空")
    for label in theme_labels:
        lines.append(f"| {label} | {report.by_label.get(label, 0)} |")

    lines.extend([
        "",
        "## 地区分类",
        "",
        "| 地区 | 数量 |",
        "|------|------|",
    ])
    for label, count in sorted(report.by_label.items(), key=lambda x: (-x[1], x[0])):
        if label not in theme_labels and label != "未分类":
            lines.append(f"| {label} | {count} |")

    lines.extend(["", "## 按文件夹", "", "| 文件夹 | 数量 |", "|--------|------|"])
    for folder, count in sorted(report.by_folder.items(), key=lambda x: (-x[1], x[0])):
        lines.append(f"| `{folder}` | {count} |")

    lines.extend(["", "---", "", "## 文件明细", ""])
    for item in report.files:
        if item.action == "copied":
            status = "✅"
        elif item.error:
            status = "❌"
        else:
            status = "⏸️"
        lines.append(f"### {status} `{Path(item.source).name}`")
        lines.append("")
        if item.error:
            lines.append(f"- 错误: {item.error}")
        elif item.action == "copied":
            lines.append(f"- 识别: **{item.label}**")
            lines.append(f"- 置信度: {item.confidence:.2f}")
            lines.append(f"- 方法: {item.method}")
            lines.append(f"- 副本: `{item.destination}`")
        else:
            lines.append(f"- 未分类 (confidence {item.confidence:.2f})")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def _render_markdown(report: OrganizeReport) -> str:
    return _render_summary_report(report)
