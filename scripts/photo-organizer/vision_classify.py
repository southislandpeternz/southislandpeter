"""Vision-only photo classification (no GPS)."""

from __future__ import annotations

from pathlib import Path

from classifiers import ClassificationResult, Signal, classify_by_filename
from classifiers import _ollama_classify, _openai_classify  # noqa: PLC2701
from config import ALL_TARGETS, CONFIDENCE_THRESHOLD
from vision import analyze_thumbnail, best_match


def _ai_vision(path: Path) -> list[Signal]:
    for fn in (_openai_classify, _ollama_classify):
        hits = fn(path)
        if hits:
            return hits
    return []


def classify_photo_vision(path: Path) -> ClassificationResult:
    filename_hits = classify_by_filename(path)
    if filename_hits:
        best = max(filename_hits, key=lambda s: s.score)
        if best.score >= 0.75:
            t = ALL_TARGETS[best.target_id]
            return ClassificationResult(
                target_id=best.target_id,
                folder=t.folder,
                confidence=best.score,
                method="filename",
                signals=filename_hits,
                label=t.label,
            )

    ai_hits = _ai_vision(path)
    if ai_hits:
        best = max(ai_hits, key=lambda s: s.score)
        if best.score >= CONFIDENCE_THRESHOLD:
            t = ALL_TARGETS[best.target_id]
            method = "openai" if "openai" in (best.detail or "").lower() else "ollama"
            if method not in ("openai", "ollama"):
                method = "ai"
            return ClassificationResult(
                target_id=best.target_id,
                folder=t.folder,
                confidence=best.score,
                method=method,
                signals=ai_hits,
                label=t.label,
            )

    scores = analyze_thumbnail(path)
    signals = [
        Signal(tid, sc, "thumbnail vision")
        for tid, sc in sorted(scores.items(), key=lambda x: -x[1])
    ]

    target_id, confidence = best_match(scores, min_confidence=CONFIDENCE_THRESHOLD)
    if target_id is None:
        return ClassificationResult(
            None, None, confidence, "vision_uncertain", signals, label=None
        )

    t = ALL_TARGETS[target_id]
    return ClassificationResult(
        target_id=target_id,
        folder=t.folder,
        confidence=confidence,
        method="vision",
        signals=signals,
        label=t.label,
    )
