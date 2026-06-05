#!/usr/bin/env python3
"""Score and filter candidate homepage travel photos."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import cv2
    import numpy as np
except ImportError:
    print(json.dumps({"error": "cv2 missing"}))
    sys.exit(1)

TEXT_NAME_RE = re.compile(
    r"(screenshot|screen.?shot|截屏|截图|微信|wechat|chat|行程|房型|"
    r"review|评价|咨询|说明|文字|itinerary|hotel.?room)",
    re.I,
)

SCENERY_CATS = {
    "mount-cook",
    "lake-pukaki",
    "lake-tekapo",
    "kaikoura",
    "milford-sound",
    "queenstown",
}


def md5_file(path: str) -> str:
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def dhash(gray: np.ndarray, size: int = 12) -> str:
    img = cv2.resize(gray, (size + 1, size), interpolation=cv2.INTER_AREA)
    diff = img[:, 1:] > img[:, :-1]
    return "".join("1" if v else "0" for v in diff.flatten())


def hamming(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def skin_ratio(bgr: np.ndarray) -> float:
    b, g, r = cv2.split(bgr)
    cond1 = (r > 55) & (g > 35) & (b > 15) & (r > g) & (g > b) & ((r - g) < 55) & ((g - b) > 8)
    cond2 = (r > 175) & (g > 135) & (b > 100) & (r > g) & (g > b)
    skin = cond1 | cond2
    return float(skin.mean())


def load_image(path: str):
    data = np.fromfile(path, dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    return bgr, gray


def reject_reason(path: str, category: str, bgr, gray) -> str | None:
    name = Path(path).name
    if TEXT_NAME_RE.search(name):
        return "text_filename"
    if Path(path).suffix.lower() == ".png":
        return "png_screenshot"

    h, w = gray.shape[:2]
    long_edge = max(w, h)
    short_edge = min(w, h)
    ar = w / h if h else 1

    if long_edge < 600:
        return "too_small"
    if short_edge < 400:
        return "too_small"

    light = float((gray > 200).mean())
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = float(edges.mean() / 255)
    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    skin = skin_ratio(bgr)

    # Banner / chat / itinerary text screenshots
    if ar > 2.0 or ar < 0.48:
        return "text_aspect"
    if light > 0.62 and edge_ratio < 0.22:
        return "text_ui"
    if h < 420 and w > h * 1.5 and light > 0.55:
        return "text_banner"
    if 1.65 < (h / max(w, 1)) < 2.4 and light > 0.45 and edge_ratio > 0.12:
        return "phone_screenshot"
    if ar < 0.78 and light > 0.52 and edge_ratio < 0.25:
        return "portrait_screenshot"

    if lap < 120:
        return "too_blurry"

    if category in SCENERY_CATS:
        if skin > 0.28:
            return "portrait_not_scenery"
        if light > 0.72 and lap > 3000:
            return "text_sharp_ui"

    if category == "vehicle":
        if skin > 0.45:
            return "not_vehicle"

    if category == "guests":
        if light > 0.55 and edge_ratio > 0.18 and skin < 0.06:
            return "text_not_guest"
        if skin < 0.05 and category == "guests":
            return "no_people"

    return None


def photo_score(gray: np.ndarray) -> float:
    lap = cv2.Laplacian(gray, cv2.CV_64F).var()
    h, w = gray.shape[:2]
    mp = (w * h) / 1e6
    return float(lap) * 0.6 + mp * 40


def main() -> None:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "usage: xhs-showcase-score.py <category> <exclude.json> <path>..."}))
        sys.exit(1)

    category = sys.argv[1]
    exclude_md5 = set()
    exclude_dhash = []
    paths = sys.argv[2:]
    if paths and paths[0].endswith(".json") and Path(paths[0]).exists():
        try:
            ex = json.loads(Path(paths[0]).read_text(encoding="utf-8"))
            exclude_md5 = set(ex.get("md5", []))
            exclude_dhash = list(ex.get("dhash", []))
        except (json.JSONDecodeError, OSError):
            pass
        paths = paths[1:]

    rows = []
    seen_md5: set[str] = set()

    for path in paths:
        try:
            digest = md5_file(path)
        except OSError:
            continue
        if digest in seen_md5 or digest in exclude_md5:
            continue
        seen_md5.add(digest)

        loaded = load_image(path)
        if loaded is None:
            continue
        bgr, gray = loaded
        reason = reject_reason(path, category, bgr, gray)
        if reason:
            continue

        dh = dhash(gray)
        if any(hamming(dh, prev) < 10 for prev in exclude_dhash):
            continue
        if any(hamming(dh, row["dhash"]) < 10 for row in rows):
            continue

        rows.append(
            {
                "path": path,
                "score": photo_score(gray),
                "md5": digest,
                "dhash": dh,
            }
        )

    rows.sort(key=lambda r: r["score"], reverse=True)
    print(json.dumps(rows))


if __name__ == "__main__":
    main()
