"""Extract keyframes from video files for visual classification."""

from __future__ import annotations

from pathlib import Path
from typing import List, Tuple

from config import VIDEO_KEYFRAME_COUNT


def _frame_indices(total: int, count: int) -> List[int]:
    if total <= 0:
        return [0]
    count = max(1, min(count, total))
    if count == 1:
        return [total // 2]
    step = (total - 1) / (count - 1)
    return sorted({min(total - 1, int(round(i * step))) for i in range(count)})


def _read_with_imageio(path: Path, indices: List[int]) -> List[Tuple[int, object]]:
    import imageio

    reader = imageio.get_reader(str(path), format="FFMPEG")
    try:
        total = reader.count_frames()
        if total <= 0:
            total = max(indices) + 1
        picked = _frame_indices(total, len(indices))
        out: List[Tuple[int, object]] = []
        for idx in picked:
            out.append((idx, reader.get_data(idx)))
        return out
    finally:
        reader.close()


def _read_with_opencv(path: Path, count: int) -> List[Tuple[int, object]]:
    import cv2

    cap = cv2.VideoCapture(str(path))
    if not cap.isOpened():
        return []
    try:
        total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        indices = _frame_indices(total, count) if total > 0 else list(range(count))
        out: List[Tuple[int, object]] = []
        for idx in indices:
            if total > 0:
                cap.set(cv2.CAP_PROP_POS_FRAMES, idx)
            ok, frame = cap.read()
            if not ok:
                continue
            frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            out.append((idx, frame))
        return out
    finally:
        cap.release()


def extract_keyframe_images(path: Path, count: int = VIDEO_KEYFRAME_COUNT) -> List[Tuple[int, object]]:
    """Return list of (frame_index, PIL.Image | ndarray)."""
    from PIL import Image

    raw_frames: List[Tuple[int, object]] = []
    try:
        raw_frames = _read_with_imageio(path, _frame_indices(1000, count))
    except Exception:
        raw_frames = []

    if not raw_frames:
        try:
            raw_frames = _read_with_opencv(path, count)
        except Exception:
            raw_frames = []

    images: List[Tuple[int, object]] = []
    for idx, data in raw_frames:
        if hasattr(data, "shape"):
            images.append((idx, Image.fromarray(data)))
        else:
            images.append((idx, data))
    return images
