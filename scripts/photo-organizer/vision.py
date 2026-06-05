"""Thumbnail-based visual recognition (no GPS)."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple

from config import ALL_TARGETS, CATEGORIES, REGIONS

THUMB_SIZE = 512
SKIN_GRID = 20
MIN_PEOPLE_FOR_GUESTS = 2


def _load_thumb(path: Path):
    try:
        from PIL import Image
    except ImportError:
        return None
    try:
        with Image.open(path) as img:
            img = img.convert("RGB")
            img.thumbnail((THUMB_SIZE, THUMB_SIZE))
            return img
    except Exception:
        return None


def _is_skin(r: int, g: int, b: int) -> bool:
    if r > 55 and g > 35 and b > 15 and r > g > b and (r - g) < 55 and (g - b) > 8:
        return True
    if r > 175 and g > 135 and b > 100 and r > g > b:
        return True
    if r > 38 and g > 22 and b > 12 and r > g > b and (r - g) < 45:
        return True
    return False


def _stats(img) -> dict:
    w, h = img.size
    pixels = list(img.getdata())
    n = len(pixels) or 1
    brightness = [(r + g + b) / 3 for r, g, b in pixels]
    avg_b = sum(brightness) / n
    dark = sum(1 for b in brightness if b < 50) / n
    bright = sum(1 for b in brightness if b > 220) / n
    mid = sum(1 for b in brightness if 80 < b < 200) / n
    sat = sum(1 for r, g, b in pixels if max(r, g, b) - min(r, g, b) > 40) / n
    blue_dom = sum(1 for r, g, b in pixels if b > r + 12 and b > g + 4) / n
    green_dom = sum(1 for r, g, b in pixels if g > r + 8 and g > b + 4) / n
    warm = sum(1 for r, g, b in pixels if r > 100 and g > 60 and b < 110 and r > g > b) / n
    skin = sum(1 for r, g, b in pixels if _is_skin(r, g, b)) / n
    gray = sum(
        1 for r, g, b in pixels
        if max(r, g, b) - min(r, g, b) < 30 and 50 < (r + g + b) / 3 < 180
    ) / n
    white = sum(1 for r, g, b in pixels if min(r, g, b) > 175) / n
    return {
        "w": w, "h": h, "n": n, "avg_b": avg_b, "dark": dark, "bright": bright,
        "mid": mid, "sat": sat, "blue_dom": blue_dom, "green_dom": green_dom,
        "warm": warm, "skin": skin, "gray": gray, "white": white,
    }


def _zone_pixels(img, y0: float, y1: float, x0: float = 0.0, x1: float = 1.0) -> List[Tuple[int, int, int]]:
    w, h = img.size
    out = []
    for y in range(int(h * y0), int(h * y1)):
        for x in range(int(w * x0), int(w * x1), 2):
            out.append(img.getpixel((x, y)))
    return out


def _people_peaks(img) -> int:
    """Count people via horizontal skin-density peaks."""
    w, h = img.size
    bins = max(12, w // 24)
    hist = [0] * bins
    for y in range(0, h, 3):
        for x in range(0, w, 3):
            r, g, b = img.getpixel((x, y))
            if _is_skin(r, g, b):
                hist[min(bins - 1, x * bins // w)] += 1
    if not hist or max(hist) == 0:
        return 0
    threshold = max(hist) * 0.22
    peaks = 0
    in_peak = False
    for v in hist:
        if v > threshold and not in_peak:
            peaks += 1
            in_peak = True
        elif v <= threshold * 0.7:
            in_peak = False
    return peaks


def estimate_people_count(img) -> int:
    """Estimate distinct people via skin clusters and horizontal peaks."""
    w, h = img.size
    cols = max(4, w // SKIN_GRID)
    rows = max(4, h // SKIN_GRID)
    skin_grid = [[False] * cols for _ in range(rows)]

    for row in range(rows):
        y0 = int(row * h / rows)
        y1 = int((row + 1) * h / rows)
        for col in range(cols):
            x0 = int(col * w / cols)
            x1 = int((col + 1) * w / cols)
            skin = total = 0
            for y in range(y0, y1, 2):
                for x in range(x0, x1, 2):
                    r, g, b = img.getpixel((x, y))
                    total += 1
                    if _is_skin(r, g, b):
                        skin += 1
            if total and skin / total > 0.11:
                skin_grid[row][col] = True

    visited: set[tuple[int, int]] = set()
    components = 0
    for row in range(rows):
        for col in range(cols):
            if not skin_grid[row][col] or (row, col) in visited:
                continue
            stack = [(row, col)]
            size = 0
            while stack:
                cr, cc = stack.pop()
                if (cr, cc) in visited or not skin_grid[cr][cc]:
                    continue
                visited.add((cr, cc))
                size += 1
                for dr, dc in ((0, 1), (0, -1), (1, 0), (-1, 0)):
                    nr, nc = cr + dr, cc + dc
                    if 0 <= nr < rows and 0 <= nc < cols:
                        stack.append((nr, nc))
            if size >= 2:
                components += 1

    peaks = _people_peaks(img)
    return max(components, peaks)


def _best_region_score(s: dict, img) -> float:
    return max((fn(s, img) for fn in REGION_SCORERS.values()), default=0.0)


def _score_scenery(s: dict, img) -> float:
    """Landscape: no obvious human subject, nature dominates."""
    if s["skin"] > 0.07:
        return 0.0
    people = estimate_people_count(img)
    if people >= 1:
        return 0.0
    nature = s["blue_dom"] + s["green_dom"] + s["white"] * 0.5
    if nature < 0.15:
        return 0.0
    upper = _zone_pixels(img, 0, 0.5)
    sky = sum(1 for r, g, b in upper if b > r or min(r, g, b) > 160) / max(len(upper), 1)
    return min(1.0, nature * 1.6 + sky * 0.5)


def _score_stars(s: dict, img) -> float:
    if s["skin"] > 0.05:
        return 0.0
    if s["avg_b"] > 85 or s["dark"] < 0.35:
        return 0.0
    score = s["dark"] * 0.5 + s["bright"] * 8
    upper = _zone_pixels(img, 0, 0.55)
    upper_b = sum(sum(p) for p in upper) / (3 * max(len(upper), 1))
    if upper_b < 60:
        score += 0.25
    return min(1.0, score)


def _score_food(s: dict, img) -> float:
    if s["skin"] > 0.14:
        return 0.0
    center = _zone_pixels(img, 0.28, 0.72, 0.22, 0.78)
    edge = _zone_pixels(img, 0, 0.2) + _zone_pixels(img, 0.8, 1.0)
    if not center:
        return 0.0
    warm_c = sum(
        1 for r, g, b in center
        if r > 90 and g > 50 and b < 130 and r >= g >= b * 0.75
    ) / len(center)
    sat_c = sum(1 for r, g, b in center if max(r, g, b) - min(r, g, b) > 45) / len(center)
    edge_warm = sum(
        1 for r, g, b in edge
        if r > 90 and g > 50 and b < 130
    ) / max(len(edge), 1)
    if warm_c < 0.18 or sat_c < 0.22:
        return 0.0
    # Food should dominate center, not edges
    if warm_c < edge_warm * 1.15:
        return 0.0
    return min(1.0, warm_c * 2.0 + sat_c * 0.5)


def _score_guests(s: dict, img) -> float:
    people = estimate_people_count(img)
    if people < MIN_PEOPLE_FOR_GUESTS:
        return 0.0
    center = _zone_pixels(img, 0.12, 0.88, 0.08, 0.92)
    if not center:
        return 0.0
    skin_c = sum(1 for r, g, b in center if _is_skin(r, g, b)) / len(center)
    if skin_c < 0.10:
        return 0.0
    # Penalise if vehicle/food/lodging signals stronger than people
    if _score_food(s, img) > skin_c * 1.2:
        return 0.0
    if _score_mercedes(s, img) > skin_c:
        return 0.0
    return min(1.0, skin_c * 1.8 + min(people, 5) * 0.08)


def _score_mercedes(s: dict, img) -> float:
    if s["skin"] > 0.10:
        return 0.0
    lower = _zone_pixels(img, 0.40, 1.0)
    mid = _zone_pixels(img, 0.25, 0.75)
    if not lower:
        return 0.0
    gray_l = sum(
        1 for r, g, b in lower
        if max(r, g, b) - min(r, g, b) < 38 and 30 < (r + g + b) / 3 < 180
    ) / len(lower)
    dark_l = sum(1 for r, g, b in lower if (r + g + b) / 3 < 85) / len(lower)
    mid_skin = sum(1 for r, g, b in mid if _is_skin(r, g, b)) / max(len(mid), 1)
    if mid_skin > 0.08:
        return 0.0
    score = gray_l * 1.5 + dark_l * 0.9
    if score < 0.42:
        return 0.0
    return min(1.0, score)


def _score_lodging(s: dict, img) -> float:
    if s["dark"] > 0.55 or s["skin"] > 0.12:
        return 0.0
    upper = _zone_pixels(img, 0, 0.32)
    lower = _zone_pixels(img, 0.58, 1.0)
    if not upper or not lower:
        return 0.0
    u_avg = sum(sum(p) for p in upper) / (3 * len(upper))
    l_avg = sum(sum(p) for p in lower) / (3 * len(lower))
    # Room: ceiling lighter, furniture/bed warmer below, low sky blue
    if s["blue_dom"] > 0.25:
        return 0.0
    if l_avg > u_avg * 1.04 and 65 < s["avg_b"] < 195 and s["sat"] < 0.62:
        indoor = (l_avg - u_avg) / 55 + 0.30
        return min(1.0, indoor)
    return 0.0


def _score_lake_tekapo(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    if s["blue_dom"] < 0.12:
        return 0.0
    mid = _zone_pixels(img, 0.3, 0.8)
    turquoise = sum(
        1 for r, g, b in mid if b > r + 10 and b > 100 and g > 80
    ) / max(len(mid), 1)
    return min(1.0, turquoise * 2.5 + s["blue_dom"] * 0.5)


def _score_mount_cook(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    upper = _zone_pixels(img, 0, 0.45)
    if not upper:
        return 0.0
    snow = sum(1 for r, g, b in upper if min(r, g, b) > 165) / len(upper)
    return min(1.0, snow * 2.0) if snow > 0.08 else 0.0


def _score_milford(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    w, h = img.size
    water = cliff = 0
    for y in range(h):
        for x in range(0, w, 3):
            r, g, b = img.getpixel((x, y))
            if y > h * 0.5 and b > r + 5 and b > 60:
                water += 1
            if y < h * 0.5 and max(r, g, b) - min(r, g, b) < 45:
                cliff += 1
    t = (w * h // 3) or 1
    score = water / t * 1.5 + cliff / t * 0.8
    return min(1.0, score * 2.5) if score > 0.06 else 0.0


def _score_kaikoura(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    coast = _zone_pixels(img, 0.45, 1.0)
    if not coast:
        return 0.0
    sea = sum(1 for r, g, b in coast if b > 70 and g > 60) / len(coast)
    return min(1.0, sea * 2.2) if sea > 0.12 else 0.0


def _score_wanaka(s: dict, img) -> float:
    return _score_lake_tekapo(s, img) * 0.85


def _score_queenstown(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    if s["blue_dom"] < 0.08:
        return 0.0
    upper = _zone_pixels(img, 0, 0.4)
    peaks = sum(1 for r, g, b in upper if max(r, g, b) - min(r, g, b) < 50) / max(len(upper), 1)
    return min(1.0, s["blue_dom"] * 1.2 + peaks * 0.6)


def _score_moeraki(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    beach = _zone_pixels(img, 0.35, 1.0)
    if not beach:
        return 0.0
    sand = sum(1 for r, g, b in beach if r > 95 and g > 85 and b > 65) / len(beach)
    return min(1.0, sand * 1.8) if sand > 0.15 else 0.0


def _score_christchurch(s: dict, img) -> float:
    if s["skin"] > 0.10:
        return 0.0
    urban = s["green_dom"] * 0.8 + s["gray"] * 0.6
    return min(1.0, urban) if urban > 0.35 else 0.0


def _score_akaroa(s: dict, img) -> float:
    if s["skin"] > 0.08:
        return 0.0
    water = _score_kaikoura(s, img)
    hills = _zone_pixels(img, 0.2, 0.6)
    green_h = sum(1 for r, g, b in hills if g > r and g > 60) / max(len(hills), 1)
    return min(1.0, water * 0.6 + green_h * 0.8) if water > 0.08 else 0.0


def _score_hanmer(s: dict, img) -> float:
    if s["skin"] > 0.10 or s["warm"] < 0.12:
        return 0.0
    return min(1.0, s["warm"] * 1.5) if s["warm"] > 0.4 else 0.0


def _score_dunedin(s: dict, img) -> float:
    if s["skin"] > 0.10:
        return 0.0
    building = s["gray"] * 1.2 + s["mid"] * 0.4
    return min(1.0, building) if building > 0.45 else 0.0


def _score_arrowtown(s: dict, img) -> float:
    if s["skin"] > 0.10:
        return 0.0
    mid = _zone_pixels(img, 0.25, 0.75)
    autumn = sum(
        1 for r, g, b in mid
        if r > 100 and g > 60 and b < 90 and r > g > b
    ) / max(len(mid), 1)
    historic = s["gray"] * 0.5 + autumn * 1.2
    return min(1.0, historic) if historic > 0.35 else 0.0


def _score_oamaru(s: dict, img) -> float:
    if s["skin"] > 0.10:
        return 0.0
    stone = sum(
        1 for r, g, b in _zone_pixels(img, 0.2, 0.8)
        if max(r, g, b) - min(r, g, b) < 40 and 80 < (r + g + b) / 3 < 180
    ) / max(len(_zone_pixels(img, 0.2, 0.8)) or 1, 1)
    coast = _score_kaikoura(s, img) * 0.4
    return min(1.0, stone * 1.3 + coast) if stone > 0.2 else 0.0


CATEGORY_SCORERS = {
    "stars": _score_stars,
    "food": _score_food,
    "guests": _score_guests,
    "cars": _score_mercedes,
    "lodging": _score_lodging,
    "scenery": _score_scenery,
}

REGION_SCORERS = {
    "lake-tekapo": _score_lake_tekapo,
    "mount-cook": _score_mount_cook,
    "milford-sound": _score_milford,
    "kaikoura": _score_kaikoura,
    "wanaka": _score_wanaka,
    "queenstown": _score_queenstown,
    "moeraki-boulders": _score_moeraki,
    "christchurch": _score_christchurch,
    "akaroa": _score_akaroa,
    "hanmer-springs": _score_hanmer,
    "dunedin": _score_dunedin,
    "arrowtown": _score_arrowtown,
    "oamaru": _score_oamaru,
}

CATEGORY_PRIORITY = ("stars", "food", "guests", "cars", "lodging", "scenery")

THEME_IDS = frozenset(CATEGORIES.keys())
REGION_IDS = frozenset(REGIONS.keys())


def analyze_image(img) -> Dict[str, float]:
    """Run vision scorers on a PIL image."""
    s = _stats(img)
    scores: Dict[str, float] = {}

    for cid, fn in CATEGORY_SCORERS.items():
        sc = fn(s, img)
        if sc > 0:
            scores[cid] = sc

    best_cat = max((scores.get(c, 0) for c in CATEGORY_PRIORITY), default=0)
    cat_boost = 1.0 if best_cat < 0.55 else 0.50

    for rid, fn in REGION_SCORERS.items():
        sc = fn(s, img) * cat_boost
        if sc > 0:
            scores[rid] = sc

    return scores


def filter_scores(scores: Dict[str, float], allowed_ids: frozenset[str] | set[str]) -> Dict[str, float]:
    return {k: v for k, v in scores.items() if k in allowed_ids}


def analyze_thumbnail(path: Path) -> Dict[str, float]:
    img = _load_thumb(path)
    if img is None:
        return {}
    return analyze_image(img)


def analyze_details(path: Path) -> dict:
    img = _load_thumb(path)
    if img is None:
        return {"scores": {}, "people_count": 0, "skin_ratio": 0.0, "scenery_score": 0.0, "region_score": 0.0}
    s = _stats(img)
    scores = analyze_image(img)
    return {
        "scores": scores,
        "people_count": estimate_people_count(img),
        "skin_ratio": s["skin"],
        "scenery_score": _score_scenery(s, img),
        "region_score": _best_region_score(s, img),
    }


def best_match(scores: Dict[str, float], min_confidence: float = 0.42) -> Tuple[str | None, float]:
    if not scores:
        return None, 0.0
    ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
    best_id, best_score = ranked[0]
    second = ranked[1][1] if len(ranked) > 1 else 0.0
    if best_score < min_confidence:
        return None, best_score
    if best_score - second < 0.06 and best_score < 0.60:
        return None, best_score
    return best_id, best_score


def _label_for(target_id: str) -> str:
    if target_id == "scenery":
        return "风景"
    return ALL_TARGETS[target_id].label


def audit_assignment(assigned_id: str, details: dict) -> tuple[list[str], str | None]:
    """Return (reasons, suggested_id) for a photo in assigned_id folder."""
    scores: Dict[str, float] = details.get("scores", {})
    people = details.get("people_count", 0)
    skin = details.get("skin_ratio", 0.0)
    scenery = details.get("scenery_score", 0.0)
    region = details.get("region_score", 0.0)
    assigned_score = scores.get(assigned_id, 0.0)
    reasons: list[str] = []

    theme_alts = {
        "food": scores.get("food", 0),
        "cars": scores.get("cars", 0),
        "lodging": scores.get("lodging", 0),
        "guests": scores.get("guests", 0),
        "stars": scores.get("stars", 0),
        "scenery": scores.get("scenery", 0),
    }
    best_theme = max(theme_alts.items(), key=lambda x: x[1])

    if assigned_id == "guests":
        if people < MIN_PEOPLE_FOR_GUESTS:
            reasons.append(f"检测到约 {people} 人，客人合影需至少 {MIN_PEOPLE_FOR_GUESTS} 人")
        elif assigned_score < 0.40:
            reasons.append("不符合多人合影特征")
        for tid, label in (("food", "美食"), ("cars", "奔驰商务车"), ("lodging", "酒店民宿")):
            alt = theme_alts[tid]
            if alt >= 0.42 and alt > assigned_score + 0.08:
                reasons.append(f"画面主体更像{label}")
        if scenery >= 0.50 and people < 2:
            reasons.append("无明显人物主体，更像风景")
        if region >= 0.55 and people < 2 and assigned_score < 0.35:
            reasons.append("更像地区风景照")

    elif assigned_id == "food":
        if theme_alts["food"] < 0.38:
            reasons.append("食物并非画面主体")
        if people >= 2 and theme_alts["guests"] > theme_alts["food"] + 0.08:
            reasons.append(f"检测到 {people} 人，更像客人合影")

    elif assigned_id == "cars":
        if theme_alts["cars"] < 0.42:
            reasons.append("车辆并非画面主体")
        if people >= 2 and theme_alts["guests"] > theme_alts["cars"] + 0.05:
            reasons.append("人物为主体，更像客人合影")

    elif assigned_id == "lodging":
        if theme_alts["lodging"] < 0.38:
            reasons.append("房间/室内并非画面主体")
        if scenery >= 0.50:
            reasons.append("更像户外风景")

    elif assigned_id in REGION_IDS:
        for tid, label in (("guests", "客人合影"), ("food", "美食"), ("cars", "奔驰商务车"), ("lodging", "酒店民宿")):
            alt = theme_alts[tid]
            if alt >= 0.55 and alt > assigned_score + 0.20:
                reasons.append(f"主题更像{label}，可能放错地区目录")

    suggested: str | None = None
    if reasons:
        ranked = sorted(scores.items(), key=lambda x: x[1], reverse=True)
        for cand_id, cand_score in ranked:
            if cand_id == assigned_id:
                continue
            if cand_id == "scenery" and assigned_id in THEME_IDS:
                if scenery >= 0.50:
                    suggested = "scenery"
                    break
            if cand_score >= 0.42 and cand_score > assigned_score + 0.10:
                suggested = cand_id
                break

    return reasons, suggested
