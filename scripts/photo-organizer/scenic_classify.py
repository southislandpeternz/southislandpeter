"""Classify photos into scenic spot folders (regions only)."""

from __future__ import annotations

from pathlib import Path
from typing import List

from classifiers import ClassificationResult, Signal, classify_by_filename
from config import CONFIDENCE_THRESHOLD, SCENIC_SPOTS, SCENIC_TARGET_IDS
from exif_gps import read_gps
from config import nearest_scenic_region
from vision import REGION_SCORERS, _load_thumb, _stats, best_match

ALLOWED = frozenset(SCENIC_TARGET_IDS)


def _filename_hits(path: Path) -> List[Signal]:
    hits = classify_by_filename(path)
    return [h for h in hits if h.target_id in ALLOWED]


def analyze_scenic(path: Path) -> dict:
    """Vision scores for scenic regions only."""
    img = _load_thumb(path)
    if img is None:
        return {}
    s = _stats(img)
    scores = {}
    for rid in SCENIC_TARGET_IDS:
        fn = REGION_SCORERS.get(rid)
        if not fn:
            continue
        sc = fn(s, img)
        if sc > 0:
            scores[rid] = sc
    return scores


def classify_photo_scenic(path: Path) -> ClassificationResult:
    filename_hits = _filename_hits(path)
    if filename_hits:
        best = max(filename_hits, key=lambda s: s.score)
        if best.score >= 0.72:
            t = SCENIC_SPOTS[best.target_id]
            return ClassificationResult(
                best.target_id, t.folder, best.score, "filename", filename_hits, label=t.label
            )

    coords = read_gps(path)
    gps_hits: List[Signal] = []
    if coords:
        match = nearest_scenic_region(coords[0], coords[1])
        if match:
            region_id, score = match
            gps_hits = [Signal(region_id, score, f"GPS {coords[0]:.4f}, {coords[1]:.4f}")]

    if gps_hits:
        best_gps = max(gps_hits, key=lambda s: s.score)
        if best_gps.score >= 0.55:
            t = SCENIC_SPOTS[best_gps.target_id]
            return ClassificationResult(
                best_gps.target_id, t.folder, best_gps.score, "gps",
                filename_hits + gps_hits, gps=coords, label=t.label,
            )

    scores = analyze_scenic(path)
    signals = [Signal(tid, sc, "scenic vision") for tid, sc in sorted(scores.items(), key=lambda x: -x[1])]

    target_id, confidence = best_match(scores, min_confidence=CONFIDENCE_THRESHOLD)
    if target_id is None:
        return ClassificationResult(
            None, None, confidence, "vision_uncertain", signals, gps=coords, label=None
        )

    t = SCENIC_SPOTS[target_id]
    return ClassificationResult(
        target_id=target_id,
        folder=t.folder,
        confidence=confidence,
        method="scenic_vision",
        signals=signals,
        gps=coords,
        label=t.label,
    )
