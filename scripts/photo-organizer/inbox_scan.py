"""Inbox file discovery: extensions, magic bytes, iCloud stubs."""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from typing import List, Optional, Set

from config import IGNORED_INBOX_NAMES, IMAGE_EXTENSIONS, VIDEO_EXTENSIONS

# macOS metadata / sidecars — not photos.
IGNORED_PREFIXES = ("._",)
IGNORED_SUFFIXES = {
    ".aae",
    ".xmp",
    ".xml",
    ".json",
    ".txt",
    ".pdf",
    ".db",
    ".sqlite",
    ".plist",
    ".sync",
    ".lrprev",
    ".lrmprev",
    ".lrdata",
}
ICLOUD_SUFFIX = ".icloud"

# Extra camera / phone extensions.
EXTRA_IMAGE_EXTENSIONS = {
    ".jpe",
    ".jfif",
    ".bmp",
    ".mpo",
    ".ppm",
    ".pgm",
    ".srw",
    ".orf",
    ".rw2",
    ".pef",
    ".raf",
    ".mrw",
    ".erf",
    ".3fr",
    ".iiq",
    ".raw",
    ".kdc",
    ".dcr",
    ".mos",
    ".mef",
    ".nrw",
    ".ptx",
    ".r3d",
    ".cap",
    ".iiq",
    ".eip",
}

ALL_IMAGE_EXTENSIONS: Set[str] = IMAGE_EXTENSIONS | EXTRA_IMAGE_EXTENSIONS

# JPEG SOI, PNG, GIF, WEBP, HEIC/AVIF (ftyp), TIFF, BMP
MAGIC_CHECKS = (
    (b"\xff\xd8\xff", "jpeg"),
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"GIF87a", "gif"),
    (b"GIF89a", "gif"),
    (b"RIFF", "webp"),  # need WEBP at offset 8
    (b"II*\x00", "tiff"),
    (b"MM\x00*", "tiff"),
    (b"BM", "bmp"),
)


@dataclass
class InboxScanStats:
    images: List[Path] = field(default_factory=list)
    videos: List[Path] = field(default_factory=list)
    total_files: int = 0
    icloud_stubs: int = 0
    skipped_meta: int = 0
    skipped_sidecar: int = 0
    skipped_unknown: int = 0
    skipped_samples: List[str] = field(default_factory=list)

    def note_skip(self, path: Path, reason: str) -> None:
        if len(self.skipped_samples) < 20:
            self.skipped_samples.append(f"{path.name} ({reason})")


def _read_head(path: Path, n: int = 32) -> bytes:
    try:
        with path.open("rb") as fh:
            return fh.read(n)
    except OSError:
        return b""


def has_image_magic(path: Path) -> bool:
    head = _read_head(path)
    if not head:
        return False
    if head.startswith(b"\xff\xd8\xff"):
        return True
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return True
    if head.startswith(b"GIF87a") or head.startswith(b"GIF89a"):
        return True
    if head.startswith(b"BM"):
        return True
    if head.startswith(b"II*\x00") or head.startswith(b"MM\x00*"):
        return True
    if len(head) >= 12 and head[4:8] == b"ftyp":
        brand = head[8:12]
        if brand in {b"heic", b"heix", b"hevc", b"hevx", b"avif", b"mif1", b"msf1"}:
            return True
    if len(head) >= 12 and head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return True
    return False


def normalized_suffixes(path: Path) -> List[str]:
    """Return lowercase suffixes, e.g. photo.JPG.icloud -> ['.jpg', '.icloud']."""
    name = path.name.lower()
    suffixes: List[str] = []
    rest = name
    while True:
        suf = Path(rest).suffix
        if not suf:
            break
        suffixes.append(suf.lower())
        rest = rest[: -len(suf)]
    return suffixes


def is_icloud_stub(path: Path) -> bool:
    return ICLOUD_SUFFIX in normalized_suffixes(path)


def extension_match(path: Path) -> bool:
    suffixes = normalized_suffixes(path)
    if not suffixes:
        return False
    # photo.jpg.icloud -> still recognize .jpg before .icloud
    for suf in suffixes:
        if suf == ICLOUD_SUFFIX:
            continue
        if suf in ALL_IMAGE_EXTENSIONS:
            return True
    return False


def should_skip(path: Path) -> Optional[str]:
    name = path.name
    lower = name.lower()
    if lower in IGNORED_INBOX_NAMES or lower == ".ds_store":
        return "ignored"
    if name.startswith(IGNORED_PREFIXES):
        return "appledouble"
    suffixes = normalized_suffixes(path)
    if suffixes and all(s in IGNORED_SUFFIXES | {ICLOUD_SUFFIX} for s in suffixes):
        if ICLOUD_SUFFIX in suffixes:
            return None  # handled separately
        return "sidecar"
    if suffixes and suffixes[0] in IGNORED_SUFFIXES:
        return "sidecar"
    return None


def is_video_file(path: Path) -> bool:
    if is_icloud_stub(path):
        return False
    skip = should_skip(path)
    if skip:
        return False
    suffixes = normalized_suffixes(path)
    for suf in suffixes:
        if suf == ICLOUD_SUFFIX:
            continue
        if suf in VIDEO_EXTENSIONS:
            return True
    return False


def is_image_file(path: Path) -> bool:
    if is_icloud_stub(path):
        return False
    skip = should_skip(path)
    if skip:
        return False
    if extension_match(path):
        return True
    return has_image_magic(path)


def iter_inbox_files(inbox: Path) -> List[Path]:
    stats = scan_inbox(inbox)
    return stats.images


def scan_inbox(inbox: Path) -> InboxScanStats:
    stats = InboxScanStats()
    if not inbox.exists():
        return stats

    for dirpath, _dirnames, filenames in os.walk(inbox, followlinks=True):
        for filename in sorted(filenames):
            path = Path(dirpath) / filename
            if not path.is_file():
                continue
            stats.total_files += 1

            if is_icloud_stub(path):
                stats.icloud_stubs += 1
                stats.note_skip(path, "iCloud stub — download in Finder")
                continue

            skip = should_skip(path)
            if skip == "appledouble":
                stats.skipped_meta += 1
                stats.note_skip(path, "AppleDouble metadata")
                continue
            if skip in {"ignored", "sidecar"}:
                stats.skipped_sidecar += 1
                stats.note_skip(path, skip)
                continue

            if is_image_file(path):
                stats.images.append(path)
                continue

            if is_video_file(path):
                stats.videos.append(path)
                continue

            stats.skipped_unknown += 1
            stats.note_skip(path, f"unknown ext {path.suffix!r}")

    stats.images.sort()
    stats.videos.sort()
    return stats
