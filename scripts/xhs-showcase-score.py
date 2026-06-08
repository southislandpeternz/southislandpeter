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
    r"review|评价|咨询|说明|文字|itinerary|hotel.?room|"
    r"flight|airline|boarding|航班|登机|机票|air.?nz|qantas|jetstar)",
    re.I,
)

FLIGHT_NAME_RE = re.compile(
    r"(flight|airline|boarding|航班|登机|机票|departure|arrival|gate|seat.?map)",
    re.I,
)

SCENERY_CATS = {
    "mount-cook",
    "lake-pukaki",
    "lake-tekapo",
    "kaikoura",
    "milford-sound",
    "queenstown",
    "wanaka",
    "akaroa",
    "west-coast",
    "tekapo-stars",
}

PERSON_CATS = {"guests", "peter"}


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


def person_hash(gray: np.ndarray, size: int = 10) -> str:
    h, w = gray.shape[:2]
    y0, y1 = int(h * 0.04), int(h * 0.58)
    x0, x1 = int(w * 0.12), int(w * 0.88)
    crop = gray[y0:y1, x0:x1]
    if crop.size < 100:
        return dhash(gray, size)
    return dhash(crop, size)


def load_image(path: str):
    data = np.fromfile(path, dtype=np.uint8)
    bgr = cv2.imdecode(data, cv2.IMREAD_COLOR)
    if bgr is None:
        return None
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    return bgr, gray


def is_flight_screenshot(gray: np.ndarray, category: str) -> bool:
    """Dark-background airline / flight tracker / boarding app screenshots."""
    if category == "tekapo-stars":
        return False
    dark = float((gray < 55).mean())
    avg = float(gray.mean())
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = float(edges.mean() / 255)
    bright = float((gray > 190).mean())
    h, w = gray.shape[:2]
    ar = w / h if h else 1

    if dark > 0.52 and avg < 58 and bright < 0.18 and edge_ratio > 0.05:
        return True
    if dark > 0.42 and avg < 72 and 0.45 < ar < 2.3 and edge_ratio > 0.07 and bright < 0.22:
        return True
    return False


def reject_reason(path: str, category: str, bgr, gray) -> str | None:
    name = Path(path).name
    if TEXT_NAME_RE.search(name) or FLIGHT_NAME_RE.search(name):
        return "text_filename"
    if Path(path).suffix.lower() == ".png" and category != "peter":
        return "png_screenshot"

    h, w = gray.shape[:2]
    long_edge = max(w, h)
    short_edge = min(w, h)
    ar = w / h if h else 1

    if long_edge < 600 and category != "peter":
        return "too_small"
    if short_edge < 400 and category != "peter":
        return "too_small"

    light = float((gray > 200).mean())
    edges = cv2.Canny(gray, 80, 160)
    edge_ratio = float(edges.mean() / 255)
    lap = float(cv2.Laplacian(gray, cv2.CV_64F).var())
    skin = skin_ratio(bgr)
    avg_b = float(gray.mean())
    dark = float((gray < 70).mean())

    if category == "peter":
        if skin < 0.06:
            return "no_person"
        return None

    if category == "tekapo-stars":
        if dark < 0.28 and avg_b > 80:
            return "not_night_sky"
        if avg_b > 120 and dark < 0.35:
            return "not_night_sky"
        if lap < 80:
            return "too_blurry"
        return None

    if is_flight_screenshot(gray, category):
        return "flight_screenshot"

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
        if skin < 0.05:
            return "no_people"

    return None


def photo_score(gray: np.ndarray, category: str) -> float:
    lap = cv2.Laplacian(gray, cv2.CV_64F).var()
    h, w = gray.shape[:2]
    mp = (w * h) / 1e6
    score = float(lap) * 0.6 + mp * 40
    if category == "tekapo-stars":
        dark = float((gray < 70).mean())
        score += dark * 500
    return score


def main() -> None:
    if len(sys.argv) < 3:
        print(json.dumps({"error": "usage: xhs-showcase-score.py <category> <exclude.json> <path>..."}))
        sys.exit(1)

    category = sys.argv[1]
    exclude_md5 = set()
    exclude_dhash = []
    exclude_person = []
    paths = sys.argv[2:]
    if paths and paths[0].endswith(".json") and Path(paths[0]).exists():
        try:
            ex = json.loads(Path(paths[0]).read_text(encoding="utf-8"))
            exclude_md5 = set(ex.get("md5", []))
            exclude_dhash = list(ex.get("dhash", []))
            exclude_person = list(ex.get("person_dhash", []))
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
        ph = person_hash(gray)
        if any(hamming(dh, prev) < 10 for prev in exclude_dhash):
            continue
        if any(hamming(dh, row["dhash"]) < 10 for row in rows):
            continue

        if category in PERSON_CATS or category == "guests":
            if any(hamming(ph, prev) < 8 for prev in exclude_person):
                continue
            if any(hamming(ph, row["person_dhash"]) < 8 for row in rows):
                continue

        rows.append(
            {
                "path": path,
                "score": photo_score(gray, category),
                "md5": digest,
                "dhash": dh,
                "person_dhash": ph,
            }
        )

    rows.sort(key=lambda r: r["score"], reverse=True)
    print(json.dumps(rows))


if __name__ == "__main__":
    main()
