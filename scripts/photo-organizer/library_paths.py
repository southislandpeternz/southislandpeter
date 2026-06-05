"""Locate the active NZ-Travel-photos library (Desktop vs Documents)."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Iterable, List

from config import INBOX_DIR, PHOTO_ROOT


def _unique_paths(paths: Iterable[Path]) -> List[Path]:
    seen: set[Path] = set()
    out: List[Path] = []
    for raw in paths:
        try:
            p = raw.expanduser().resolve()
        except OSError:
            continue
        if p in seen or not p.is_dir():
            continue
        seen.add(p)
        out.append(p)
    return out


def candidate_photo_roots(repo_root: Path) -> List[Path]:
    repo_root = repo_root.resolve()
    paths: List[Path] = []

    env_root = os.environ.get("NZ_TRAVEL_PHOTOS_ROOT", "").strip()
    if env_root:
        paths.append(Path(env_root))

    if repo_root.name == PHOTO_ROOT.strip():
        paths.append(repo_root)
        repo_root = repo_root.parent

    paths.append(repo_root / PHOTO_ROOT)
    paths.append(repo_root / PHOTO_ROOT.strip())

    desktop = Path.home() / "Desktop"
    if desktop.is_dir():
        paths.append(desktop / PHOTO_ROOT)
        paths.append(desktop / f"{PHOTO_ROOT} ")
        for entry in desktop.iterdir():
            if entry.is_dir() and entry.name.strip().lower().startswith("nz-travel-photos"):
                paths.append(entry)

    docs = Path.home() / "Documents"
    for docs_root in (docs, docs / "小红书AI"):
        p = docs_root / PHOTO_ROOT
        if p.is_dir():
            paths.append(p)

    icloud = Path.home() / "Library/Mobile Documents/com~apple~CloudDocs"
    for icloud_root in (icloud / "Documents" / "小红书AI", icloud / "Documents"):
        p = icloud_root / PHOTO_ROOT
        if p.is_dir():
            paths.append(p)

    return _unique_paths(paths)


def inbox_file_count(photo_root: Path, scan_fn) -> int:
    inbox = photo_root / INBOX_DIR
    if not inbox.is_dir():
        return 0
    return scan_fn(inbox).total_files


def discover_photo_root(repo_root: Path, scan_fn) -> Path:
    """Pick the library whose inbox has the most files; tie-break by image count."""
    candidates = candidate_photo_roots(repo_root)
    if not candidates:
        return repo_root / PHOTO_ROOT

    def score(p: Path) -> tuple[int, int]:
        stats = scan_fn(p / INBOX_DIR)
        return (stats.total_files, len(stats.images))

    best = max(candidates, key=score)
    if score(best) == (0, 0) and (repo_root / PHOTO_ROOT).is_dir():
        return (repo_root / PHOTO_ROOT).resolve()
    return best


def resolve_folder_path(photos_base: Path, folder_name: str) -> Path:
    """Map config folder slug to existing on-disk name (case / trailing space)."""
    exact = photos_base / folder_name
    if exact.is_dir():
        return exact
    key = folder_name.lower().strip()
    for entry in photos_base.iterdir():
        if entry.is_dir() and entry.name.lower().strip() == key:
            return entry
    exact.mkdir(parents=True, exist_ok=True)
    return exact
