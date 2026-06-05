#!/usr/bin/env python3
"""
Video Organizer — scan inbox/unsorted videos, extract keyframes, classify & copy.

Originals stay in place. Uncertain videos are not copied.
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

from config import (  # noqa: E402
    CONFIDENCE_THRESHOLD,
    INBOX_DIR,
    PHOTO_ROOT,
    REPORTS_DIR,
    UNSORTED_DIR,
    VIDEO_TARGETS,
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
from video_classify import VideoClassificationResult, classify_video_vision  # noqa: E402
from video_report import VideoFileRecord, VideoOrganizeReport, write_video_report  # noqa: E402


def collect_videos(photos_base: Path, source_names: list[str]) -> list[Path]:
    files: list[Path] = []
    for name in source_names:
        folder = photos_base / name
        scan = scan_inbox(folder)
        files.extend(scan.videos)
    return sorted(set(files))


def _frame_summary(result: VideoClassificationResult) -> tuple[list[int], list[dict]]:
    indices = [f.index for f in result.frames]
    summaries = []
    for frame in result.frames:
        ranked = sorted(frame.scores.items(), key=lambda x: -x[1])[:3]
        summaries.append({
            "index": frame.index,
            "people_count": frame.people_count,
            "top": [{"id": tid, "score": sc} for tid, sc in ranked],
        })
    return indices, summaries


def organize_videos(
    root: Path,
    photo_root_arg: Path | None = None,
    dry_run: bool = False,
    source_names: list[str] | None = None,
) -> VideoOrganizeReport:
    photos_base = photo_root(root, photo_root_arg)
    repo_base = resolve_repo_root(root, photos_base)
    rbase = report_base(repo_base, photos_base)
    reports_dir = photos_base / REPORTS_DIR

    if source_names is None:
        source_names = [INBOX_DIR, UNSORTED_DIR]

    files = collect_videos(photos_base, source_names)
    scan_display = ", ".join(str(photos_base / n) for n in source_names)

    print(f"Photo library: {photos_base}")
    print(f"Scan dirs: {scan_display}")
    print(f"  videos to recognize: {len(files)}")
    print("  mode: video keyframe + vision (no GPS)")

    records: list[VideoFileRecord] = []
    by_folder: dict[str, int] = {}
    by_label: dict[str, int] = {}
    copied = skipped = errors = 0

    for src in files:
        try:
            result = classify_video_vision(src)
            src_rel = str(src)
            try:
                src_rel = str(src.relative_to(rbase))
            except ValueError:
                pass

            indices, frame_scores = _frame_summary(result)
            signals = [asdict(s) for s in result.signals]

            classified = bool(
                result.target_id
                and result.confidence >= CONFIDENCE_THRESHOLD
                and result.method not in ("none", "ambiguous", "video_no_frames")
            )

            if not classified:
                skipped += 1
                records.append(
                    VideoFileRecord(
                        source=src_rel,
                        destination=src_rel,
                        target_id=result.target_id,
                        folder=None,
                        label=result.label,
                        confidence=result.confidence,
                        method=result.method,
                        action="skipped",
                        keyframe_count=result.keyframe_count,
                        keyframe_indices=indices,
                        frame_scores=frame_scores,
                        signals=signals,
                    )
                )
                continue

            dest_dir = resolve_folder_path(photos_base, VIDEO_TARGETS[result.target_id].folder)
            dest_dir.mkdir(parents=True, exist_ok=True)
            dest = unique_destination(dest_dir / src.name)
            dest_rel = str(dest)
            try:
                dest_rel = str(dest.relative_to(rbase))
            except ValueError:
                pass

            label = result.label or VIDEO_TARGETS[result.target_id].label
            folder_key = VIDEO_TARGETS[result.target_id].folder
            by_folder[folder_key] = by_folder.get(folder_key, 0) + 1
            by_label[label] = by_label.get(label, 0) + 1
            copied += 1

            if not dry_run:
                shutil.copy2(str(src), str(dest))

            records.append(
                VideoFileRecord(
                    source=src_rel,
                    destination=dest_rel,
                    target_id=result.target_id,
                    folder=folder_key,
                    label=label,
                    confidence=result.confidence,
                    method=result.method,
                    action="copied",
                    keyframe_count=result.keyframe_count,
                    keyframe_indices=indices,
                    frame_scores=frame_scores,
                    signals=signals,
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
                VideoFileRecord(
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

    report = VideoOrganizeReport(
        generated_at=datetime.now(timezone.utc).isoformat(),
        scan_dirs=scan_display,
        mode="video keyframe + vision（关键帧视觉识别，不依赖 GPS）",
        dry_run=dry_run,
        total=len(files),
        copied=copied,
        skipped=skipped,
        errors=errors,
        by_folder=by_folder,
        by_label=by_label,
        files=records,
    )

    json_path, md_path = write_video_report(report, reports_dir)
    print("")
    print(f"Scanned: {report.total} | Copied: {report.copied} | Skipped: {report.skipped} | Errors: {report.errors}")
    print(f"Report JSON: {json_path}")
    print(f"Report Markdown: {md_path}")
    if dry_run:
        print("(dry-run — no files were copied)")
    else:
        print("(原视频保留在原位，仅复制已识别视频到对应文件夹)")
    return report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Video Organizer — keyframe vision classify & copy")
    parser.add_argument("--root", type=Path, default=repo_root())
    parser.add_argument("--photo-root", type=Path, default=None)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--sources",
        nargs="+",
        default=[INBOX_DIR, UNSORTED_DIR],
        help="Folders to scan (default: inbox unsorted)",
    )
    return parser


def main() -> int:
    args = build_parser().parse_args()
    organize_videos(
        args.root.resolve(),
        photo_root_arg=args.photo_root.resolve() if args.photo_root else None,
        dry_run=args.dry_run,
        source_names=args.sources,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
