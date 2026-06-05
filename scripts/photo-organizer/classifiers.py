"""Filename, GPS, and AI/heuristic classifiers."""

from __future__ import annotations

import base64
import json
import os
import re
import urllib.error
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from config import (
    ALL_TARGETS,
    CATEGORIES,
    REGIONS,
    SIGNAL_WEIGHTS,
    nearest_region,
)
from exif_gps import read_gps


@dataclass
class Signal:
    target_id: str
    score: float
    detail: str = ""


@dataclass
class ClassificationResult:
    target_id: Optional[str]
    folder: Optional[str]
    confidence: float
    method: str
    signals: List[Signal] = field(default_factory=list)
    gps: Optional[Tuple[float, float]] = None
    label: Optional[str] = None

    @property
    def sorted(self) -> bool:
        return self.target_id is not None


def _normalize_text(text: str) -> str:
    return re.sub(r"[\s_\-]+", " ", text.lower()).strip()


def classify_by_filename(path: Path) -> List[Signal]:
    name = _normalize_text(path.stem)
    hits: List[Signal] = []
    for target_id, target in ALL_TARGETS.items():
        for kw in target.keywords:
            token = _normalize_text(kw)
            if token and token in name:
                score = min(1.0, 0.72 + len(token) / max(len(name), 1) * 0.28)
                hits.append(Signal(target_id, score, f"filename contains '{kw}'"))
                break
    return hits


def classify_by_gps(path: Path) -> Tuple[Optional[Tuple[float, float]], List[Signal]]:
    coords = read_gps(path)
    if not coords:
        return None, []
    match = nearest_region(coords[0], coords[1])
    if not match:
        return coords, []
    region_id, score = match
    return coords, [Signal(region_id, score, f"GPS {coords[0]:.4f}, {coords[1]:.4f}")]


def _load_rgb_sample(path: Path, max_side: int = 640):
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            img.thumbnail((max_side, max_side))
            return img
    except Exception:
        return None


def _heuristic_stars(img) -> float:
    pixels = list(img.getdata())
    n = len(pixels) or 1
    brightness = [sum(p) / 3 for p in pixels]
    avg = sum(brightness) / n
    dark_ratio = sum(1 for b in brightness if b < 45) / n
    bright_ratio = sum(1 for b in brightness if b > 210) / n
    if avg < 70 and dark_ratio > 0.45 and bright_ratio > 0.002:
        return min(1.0, dark_ratio * 0.7 + bright_ratio * 12)
    return 0.0


def _heuristic_food(img) -> float:
    pixels = list(img.getdata())
    warm = 0
    for r, g, b in pixels:
        if r > 95 and g > 55 and b < 120 and r > g > b * 0.8:
            warm += 1
    ratio = warm / (len(pixels) or 1)
    return min(1.0, ratio * 2.2) if ratio > 0.18 else 0.0


def _heuristic_car(img) -> float:
    pixels = list(img.getdata())
    metallic = 0
    for r, g, b in pixels:
        spread = max(r, g, b) - min(r, g, b)
        avg = (r + g + b) / 3
        if spread < 35 and 40 < avg < 190:
            metallic += 1
    ratio = metallic / (len(pixels) or 1)
    return min(1.0, ratio * 1.8) if ratio > 0.35 else 0.0


def _heuristic_lodging(img) -> float:
    w, h = img.size
    upper = [img.getpixel((x, y)) for y in range(h // 3) for x in range(0, w, 4)]
    lower = [img.getpixel((x, y)) for y in range(2 * h // 3, h) for x in range(0, w, 4)]
    if not upper or not lower:
        return 0.0
    upper_avg = sum(sum(p) for p in upper) / (3 * len(upper))
    lower_avg = sum(sum(p) for p in lower) / (3 * len(lower))
    if lower_avg > upper_avg * 1.08 and 60 < lower_avg < 200:
        return min(1.0, (lower_avg - upper_avg) / 80)
    return 0.0


def _heuristic_guests(img) -> float:
    w, h = img.size
    mid = [img.getpixel((x, y)) for y in range(h // 4, 3 * h // 4) for x in range(w // 4, 3 * w // 4, 3)]
    if not mid:
        return 0.0
    skin = 0
    for r, g, b in mid:
        if r > 60 and g > 40 and b > 20 and r > g > b and (r - g) < 60:
            skin += 1
    ratio = skin / len(mid)
    return min(1.0, ratio * 1.4) if ratio > 0.12 else 0.0


REGION_HEURISTICS = {
    "lake-tekapo": lambda img: _score_blue_lake(img),
    "milford-sound": lambda img: _score_fiord(img),
    "mount-cook": lambda img: _score_snow_peak(img),
    "kaikoura": lambda img: _score_coast_mountains(img),
    "wanaka": lambda img: _score_blue_lake(img) * 0.85,
    "queenstown": lambda img: _score_blue_lake(img) * 0.7 + _score_snow_peak(img) * 0.3,
    "moeraki-boulders": lambda img: _score_round_rocks(img),
    "christchurch": lambda img: _score_urban_green(img),
}


def _score_blue_lake(img) -> float:
    pixels = list(img.getdata())
    blue = sum(1 for r, g, b in pixels if b > r + 15 and b > g + 5 and b > 100)
    return min(1.0, blue / (len(pixels) or 1) * 2.5)


def _score_fiord(img) -> float:
    w, h = img.size
    water = mountain = 0
    for y in range(h):
        for x in range(0, w, 2):
            r, g, b = img.getpixel((x, y))
            if y > h * 0.55 and b > r and g > r:
                water += 1
            if y < h * 0.45 and max(r, g, b) - min(r, g, b) < 40:
                mountain += 1
    total = (w * h) // 2 or 1
    score = (water / total) * 1.2 + (mountain / total) * 0.8
    return min(1.0, score * 3) if score > 0.08 else 0.0


def _score_snow_peak(img) -> float:
    pixels = list(img.getdata())
    white = sum(1 for r, g, b in pixels if min(r, g, b) > 180)
    return min(1.0, white / (len(pixels) or 1) * 2.8)


def _score_coast_mountains(img) -> float:
    w, h = img.size
    coastal = 0
    for y in range(int(h * 0.5), h):
        for x in range(0, w, 3):
            r, g, b = img.getpixel((x, y))
            if b > 80 and g > 70:
                coastal += 1
    ratio = coastal / ((w * h // 3) or 1)
    return min(1.0, ratio * 2.5) if ratio > 0.12 else 0.0


def _score_round_rocks(img) -> float:
    w, h = img.size
    beach = 0
    for y in range(int(h * 0.4), h):
        for x in range(0, w, 4):
            r, g, b = img.getpixel((x, y))
            if r > 100 and g > 90 and b > 70 and abs(r - g) < 40:
                beach += 1
    ratio = beach / ((w * h // 4) or 1)
    return min(1.0, ratio * 2.0) if ratio > 0.15 else 0.0


def _score_urban_green(img) -> float:
    pixels = list(img.getdata())
    green = sum(1 for r, g, b in pixels if g > r + 10 and g > b + 5 and g > 80)
    return min(1.0, green / (len(pixels) or 1) * 2.2)


def classify_by_heuristics(path: Path) -> List[Signal]:
    img = _load_rgb_sample(path)
    if img is None:
        return []

    category_scores = {
        "stars": _heuristic_stars(img),
        "food": _heuristic_food(img),
        "cars": _heuristic_car(img),
        "lodging": _heuristic_lodging(img),
        "guests": _heuristic_guests(img),
    }
    region_scores = {rid: fn(img) for rid, fn in REGION_HEURISTICS.items()}

    hits: List[Signal] = []
    for target_id, score in {**category_scores, **region_scores}.items():
        if score >= 0.35:
            hits.append(Signal(target_id, score, "local image heuristics"))
    return hits


def _openai_classify(path: Path) -> List[Signal]:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return []

    labels = []
    for tid, t in ALL_TARGETS.items():
        hints = ", ".join(t.ai_hints[:3]) if t.ai_hints else t.label
        labels.append(f"{tid} | {t.label} | {hints}")

    mime = "image/jpeg"
    suffix = path.suffix.lower()
    if suffix == ".png":
        mime = "image/png"
    elif suffix in {".webp"}:
        mime = "image/webp"
    elif suffix in {".heic", ".heif"}:
        mime = "image/heic"

    data = base64.b64encode(path.read_bytes()).decode("ascii")
    prompt = (
        "You are classifying New Zealand South Island travel photos for a tour company.\n"
        "Pick exactly ONE best category id from the list, or 'none' if you cannot tell.\n\n"
        "Regions:\n"
        + "\n".join(f"  {tid} | {ALL_TARGETS[tid].label}" for tid in REGIONS)
        + "\n\nThemes:\n"
        + "\n".join(f"  {tid} | {ALL_TARGETS[tid].label}" for tid in CATEGORIES)
        + "\n\nFull list with hints:\n"
        + "\n".join(labels)
        + '\n\nRespond JSON only: {"id":"target_id_or_none","confidence":0.0-1.0,"reason":"brief"}'
    )

    body = json.dumps(
        {
            "model": os.environ.get("OPENAI_VISION_MODEL", "gpt-4o-mini"),
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{data}"}},
                    ],
                }
            ],
            "max_tokens": 180,
        }
    ).encode("utf-8")

    req = urllib.request.Request(
        "https://api.openai.com/v1/chat/completions",
        data=body,
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
        content = payload["choices"][0]["message"]["content"]
        m = re.search(r"\{.*\}", content, re.DOTALL)
        if not m:
            return []
        parsed = json.loads(m.group(0))
        target_id = parsed.get("id")
        confidence = float(parsed.get("confidence", 0))
        reason = parsed.get("reason", "openai vision")
        if target_id in (None, "none", ""):
            return []
        if target_id not in ALL_TARGETS:
            return []
        return [Signal(target_id, min(1.0, confidence), reason)]
    except (urllib.error.URLError, KeyError, json.JSONDecodeError, ValueError, IndexError):
        return []


def _ollama_classify(path: Path) -> List[Signal]:
    import urllib.request

    host = os.environ.get("OLLAMA_HOST", "http://127.0.0.1:11434").rstrip("/")
    model = os.environ.get("OLLAMA_VISION_MODEL", "llava")
    labels = "\n".join(
        f"- {tid}: {ALL_TARGETS[tid].label}" for tid in list(REGIONS) + list(CATEGORIES)
    )
    prompt = (
        "Classify this New Zealand travel photo. Reply JSON only: "
        '{"id":"target_id_or_none","confidence":0.0-1.0,"reason":"..."}\n'
        f"Choose one id or none:\n{labels}"
    )
    body = json.dumps({"model": model, "prompt": prompt, "images": [base64.b64encode(path.read_bytes()).decode()], "stream": False}).encode()
    req = urllib.request.Request(f"{host}/api/generate", data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            payload = json.loads(resp.read().decode())
        text = payload.get("response", "")
        m = re.search(r"\{.*\}", text, re.DOTALL)
        if not m:
            return []
        parsed = json.loads(m.group(0))
        target_id = parsed.get("id")
        confidence = float(parsed.get("confidence", 0))
        reason = parsed.get("reason", "ollama vision")
        if target_id in (None, "none", "") or target_id not in ALL_TARGETS:
            return []
        return [Signal(target_id, min(1.0, confidence), reason)]
    except Exception:
        return []


def classify_by_ai(path: Path) -> List[Signal]:
    for fn in (_openai_classify, _ollama_classify):
        hits = fn(path)
        if hits:
            return hits
    return classify_by_heuristics(path)


def merge_signals(
    filename_hits: List[Signal],
    gps_hits: List[Signal],
    ai_hits: List[Signal],
) -> ClassificationResult:
    # Strong GPS or filename alone
    if gps_hits:
        best_gps = max(gps_hits, key=lambda s: s.score)
        if best_gps.score >= 0.55:
            t = ALL_TARGETS[best_gps.target_id]
            return ClassificationResult(
                best_gps.target_id, t.folder, best_gps.score, "gps",
                gps_hits + filename_hits + ai_hits, label=t.label,
            )
    if filename_hits:
        best_fn = max(filename_hits, key=lambda s: s.score)
        if best_fn.score >= 0.72:
            t = ALL_TARGETS[best_fn.target_id]
            return ClassificationResult(
                best_fn.target_id, t.folder, best_fn.score, "filename",
                filename_hits + gps_hits + ai_hits, label=t.label,
            )
    if ai_hits and not filename_hits and not gps_hits:
        best_ai = max(ai_hits, key=lambda s: s.score)
        if best_ai.score >= 0.48:
            t = ALL_TARGETS[best_ai.target_id]
            method = "ai" if "openai" in best_ai.detail.lower() or "ollama" in best_ai.detail.lower() else "ai_heuristic"
            return ClassificationResult(
                best_ai.target_id, t.folder, best_ai.score, method,
                ai_hits, label=t.label,
            )

    combined: Dict[str, float] = {}
    signals: List[Signal] = []

    def add(hits: List[Signal], weight: float, prefix: str) -> None:
        for hit in hits:
            combined[hit.target_id] = combined.get(hit.target_id, 0.0) + hit.score * weight
            signals.append(Signal(hit.target_id, hit.score, f"{prefix}: {hit.detail or hit.target_id}"))

    add(filename_hits, SIGNAL_WEIGHTS["filename"], "filename")
    add(gps_hits, SIGNAL_WEIGHTS["gps"], "gps")
    add(ai_hits, SIGNAL_WEIGHTS["ai"], "ai")

    if not combined:
        return ClassificationResult(None, None, 0.0, "none", signals, label=None)

    ranked = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    best_id, best_score = ranked[0]
    second_score = ranked[1][1] if len(ranked) > 1 else 0.0

    gap = best_score - second_score
    if gap < 0.06 and best_score < 0.62:
        return ClassificationResult(None, None, best_score, "ambiguous", signals, label=None)

    if best_score < 0.40:
        return ClassificationResult(None, None, best_score, "none", signals, label=None)

    methods = []
    if filename_hits:
        methods.append("filename")
    if gps_hits:
        methods.append("gps")
    if ai_hits:
        methods.append("ai" if any("openai" in (s.detail or "").lower() for s in ai_hits) else "ai_heuristic")

    folder = ALL_TARGETS[best_id].folder
    label = ALL_TARGETS[best_id].label
    return ClassificationResult(
        target_id=best_id,
        folder=folder,
        confidence=min(1.0, best_score),
        method="+".join(methods) or "merged",
        signals=signals,
        label=label,
    )


def classify_photo(path: Path) -> ClassificationResult:
    filename_hits = classify_by_filename(path)
    gps, gps_hits = classify_by_gps(path)
    ai_hits = classify_by_ai(path)
    result = merge_signals(filename_hits, gps_hits, ai_hits)
    result.gps = gps
    return result
