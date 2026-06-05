"""Write video classification reports."""

from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from config import VIDEO_REPORT_NAME


@dataclass
class VideoFileRecord:
    source: str
    destination: str
    target_id: Optional[str]
    folder: Optional[str]
    label: Optional[str]
    confidence: float
    method: str
    action: str  # copied | skipped | error
    keyframe_count: int = 0
    keyframe_indices: List[int] = field(default_factory=list)
    frame_scores: List[Dict[str, Any]] = field(default_factory=list)
    signals: List[Dict[str, Any]] = field(default_factory=list)
    error: Optional[str] = None


@dataclass
class VideoOrganizeReport:
    generated_at: str
    scan_dirs: str
    mode: str
    dry_run: bool
    total: int
    copied: int
    skipped: int
    errors: int
    by_folder: Dict[str, int] = field(default_factory=dict)
    by_label: Dict[str, int] = field(default_factory=dict)
    files: List[VideoFileRecord] = field(default_factory=list)

    def to_dict(self) -> dict:
        return asdict(self)


def write_video_report(report: VideoOrganizeReport, reports_dir: Path) -> tuple[Path, Path]:
    reports_dir.mkdir(parents=True, exist_ok=True)
    md_path = reports_dir / VIDEO_REPORT_NAME
    json_path = reports_dir / VIDEO_REPORT_NAME.replace(".md", ".json")
    md_path.write_text(_render_markdown(report), encoding="utf-8")
    json_path.write_text(json.dumps(report.to_dict(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return json_path, md_path


def _render_markdown(report: VideoOrganizeReport) -> str:
    lines = [
        "# 视频识别报告 video-report",
        "",
        f"- 生成时间 (UTC): {report.generated_at}",
        f"- 扫描目录: `{report.scan_dirs}`",
        f"- 识别方式: {report.mode}",
        f"- 支持格式: `.mov` `.mp4` `.m4v`",
        f"- 扫描总数: **{report.total}** 个",
        f"- 已分类: **{report.copied}** 个",
        f"- 未分类: **{report.skipped}** 个",
        f"- 错误: **{report.errors}** 个",
        "",
        "## 分类数量统计",
        "",
        "| 分类 | 数量 |",
        "|------|------|",
    ]

    counts = dict(report.by_label)
    if report.skipped:
        counts["未分类"] = report.skipped
    for label, count in sorted(counts.items(), key=lambda x: (-x[1], x[0])):
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
            lines.append(f"- 关键帧: {item.keyframe_count} 帧 {item.keyframe_indices}")
            lines.append(f"- 副本: `{item.destination}`")
        else:
            lines.append(f"- 未分类 (confidence {item.confidence:.2f})")
            lines.append(f"- 关键帧: {item.keyframe_count} 帧")
        if item.frame_scores:
            lines.append("- 各帧最高分:")
            for fs in item.frame_scores:
                top = fs.get("top", [])
                top_str = ", ".join(f"{t['id']}:{t['score']:.2f}" for t in top[:3])
                lines.append(f"  - 帧 {fs.get('index')}: {top_str or '—'}")
        lines.append("")

    return "\n".join(lines).rstrip() + "\n"
