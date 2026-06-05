#!/usr/bin/env python3
"""Delete text screenshots, flight screenshots, and duplicate photos from source libraries."""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

import importlib.util

_score_spec = importlib.util.spec_from_file_location(
    "xhs_showcase_score", SCRIPT_DIR / "xhs-showcase-score.py"
)
_score_mod = importlib.util.module_from_spec(_score_spec)
assert _score_spec and _score_spec.loader
_score_spec.loader.exec_module(_score_mod)

dhash = _score_mod.dhash
hamming = _score_mod.hamming
load_image = _score_mod.load_image
md5_file = _score_mod.md5_file
reject_reason = _score_mod.reject_reason

IMAGE_EXT = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".gif", ".avif"}


def infer_category(path: Path) -> str:
    parts = " ".join(path.parts).lower()
    if "guest" in parts or "客户" in parts or "合影" in parts:
        return "guests"
    if "vehicle" in parts or "奔驰" in parts or "mercedes" in parts:
        return "vehicle"
    if "star" in parts or "星空" in parts:
        return "tekapo-stars"
    if "tekapo" in parts or "特卡波" in parts:
        return "lake-tekapo"
    if "pukaki" in parts or "普卡基" in parts:
        return "lake-pukaki"
    if "cook" in parts or "库克" in parts or "mount" in parts:
        return "mount-cook"
    return "mount-cook"


def list_images(dirs: list[Path]) -> list[Path]:
    out: list[Path] = []
    seen: set[str] = set()
    for base in dirs:
        if not base.is_dir():
            continue
        for path in base.rglob("*"):
            if not path.is_file() or path.name.startswith("."):
                continue
            if path.suffix.lower() not in IMAGE_EXT:
                continue
            key = str(path.resolve())
            if key in seen:
                continue
            seen.add(key)
            out.append(path)
    return out


def pixel_count(path: Path) -> int:
    loaded = load_image(str(path))
    if loaded is None:
        return 0
    _, gray = loaded
    h, w = gray.shape[:2]
    return w * h


def purge(dirs: list[Path], dry_run: bool = False) -> dict:
    deleted: list[dict] = []
    kept_md5: dict[str, Path] = {}
    kept_dhash: list[tuple[str, Path]] = []

    for path in sorted(list_images(dirs), key=lambda p: p.stat().st_size, reverse=True):
        category = infer_category(path)
        loaded = load_image(str(path))
        if loaded is None:
            continue
        bgr, gray = loaded
        reason = reject_reason(str(path), category, bgr, gray)
        if reason:
            if not dry_run:
                path.unlink(missing_ok=True)
            deleted.append({"path": str(path), "reason": reason})
            continue

        try:
            digest = md5_file(str(path))
        except OSError:
            continue

        if digest in kept_md5:
            if not dry_run:
                path.unlink(missing_ok=True)
            deleted.append(
                {
                    "path": str(path),
                    "reason": "duplicate_md5",
                    "kept": str(kept_md5[digest]),
                }
            )
            continue

        dh = dhash(gray)
        dup = next((p for h, p in kept_dhash if hamming(dh, h) < 10), None)
        if dup is not None:
            if pixel_count(path) <= pixel_count(dup):
                if not dry_run:
                    path.unlink(missing_ok=True)
                deleted.append(
                    {"path": str(path), "reason": "duplicate_phash", "kept": str(dup)}
                )
                continue
            if not dry_run:
                dup.unlink(missing_ok=True)
            deleted.append(
                {"path": str(dup), "reason": "duplicate_phash", "kept": str(path)}
            )
            kept_dhash = [(h, p) for h, p in kept_dhash if p != dup]
            for k, v in list(kept_md5.items()):
                if v == dup:
                    del kept_md5[k]
                    break

        kept_md5[digest] = path
        kept_dhash.append((dh, path))

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "dryRun": dry_run,
        "scannedDirs": [str(d) for d in dirs],
        "deletedCount": len(deleted),
        "deleted": deleted,
    }
    return report


def main() -> None:
    dry_run = "--dry-run" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--dry-run"]
    if not args:
        print(json.dumps({"error": "usage: purge-source-photos.py [--dry-run] <dir>..."}))
        sys.exit(1)

    dirs = [Path(a).expanduser().resolve() for a in args]
    report = purge(dirs, dry_run=dry_run)

    out_dir = ROOT / "_reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "purge-source-photos.json"
    out_path.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    by_reason: dict[str, int] = {}
    for row in report["deleted"]:
        by_reason[row["reason"]] = by_reason.get(row["reason"], 0) + 1

    print(f"Purged {report['deletedCount']} files" + (" (dry-run)" if dry_run else ""))
    for reason, count in sorted(by_reason.items()):
        print(f"  {reason}: {count}")
    print(f"Report: {out_path}")


if __name__ == "__main__":
    main()
