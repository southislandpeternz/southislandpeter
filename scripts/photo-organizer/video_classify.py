"""Classify videos by analyzing extracted keyframes with the vision model."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from classifiers import ClassificationResult, Signal, classify_by_filename
from config import CONFIDENCE_THRESHOLD, VIDEO_TARGET_IDS, VIDEO_TARGETS
from video_frames import extract_keyframe_images
from vision import analyze_image, best_match, estimate_people_count, filter_scores

ALLOWED = frozenset(VIDEO_TARGET_IDS)


@dataclass
class FrameAnalysis:
    index: int
    scores: Dict[str, float]
    people_count: int


@dataclass
class VideoClassificationResult:
    target_id: Optional[str]
    folder: Optional[str]
    label: Optional[str]
    confidence: float
    method: str
    keyframe_count: int
    frames: List[FrameAnalysis] = field(default_factory=list)
    signals: List[Signal] = field(default_factory=list)


def _merge_frame_scores(frames: List[FrameAnalysis]) -> Dict[str, float]:
    merged: Dict[str, float] = {}
    for frame in frames:
        for tid, score in frame.scores.items():
            merged[tid] = max(merged.get(tid, 0.0), score)
    return merged


def _filename_hits(path: Path) -> List[Signal]:
    hits = classify_by_filename(path)
    return [h for h in hits if h.target_id in ALLOWED]


def classify_video_vision(path: Path) -> VideoClassificationResult:
    filename_hits = _filename_hits(path)
    if filename_hits:
        best = max(filename_hits, key=lambda s: s.score)
        if best.score >= 0.75:
            t = VIDEO_TARGETS[best.target_id]
            return VideoClassificationResult(
                target_id=best.target_id,
                folder=t.folder,
                label=t.label,
                confidence=best.score,
                method="filename",
                keyframe_count=0,
                signals=filename_hits,
            )

    keyframes = extract_keyframe_images(path)
    if not keyframes:
        return VideoClassificationResult(
            None, None, None, 0.0, "video_no_frames", 0,
            signals=[Signal("", 0.0, "could not extract keyframes")],
        )

    frame_analyses: List[FrameAnalysis] = []
    for idx, img in keyframes:
        scores = filter_scores(analyze_image(img), ALLOWED)
        frame_analyses.append(FrameAnalysis(index=idx, scores=scores, people_count=estimate_people_count(img)))

    combined = _merge_frame_scores(frame_analyses)
    signals = [
        Signal(tid, sc, f"video keyframe max score")
        for tid, sc in sorted(combined.items(), key=lambda x: -x[1])
    ]

    target_id, confidence = best_match(combined, min_confidence=CONFIDENCE_THRESHOLD)
    if target_id is None:
        return VideoClassificationResult(
            None, None, None, confidence, "vision_uncertain", len(frame_analyses),
            frames=frame_analyses, signals=signals,
        )

    t = VIDEO_TARGETS[target_id]
    return VideoClassificationResult(
        target_id=target_id,
        folder=t.folder,
        label=t.label,
        confidence=confidence,
        method="video_vision",
        keyframe_count=len(frame_analyses),
        frames=frame_analyses,
        signals=signals,
    )
