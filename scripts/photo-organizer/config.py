"""Classification targets and scoring thresholds."""

from __future__ import annotations

from dataclasses import dataclass
from math import asin, cos, radians, sin, sqrt
from typing import Dict, Optional, Tuple

PHOTO_ROOT = "NZ-Travel-photos"
INBOX_DIR = "inbox"
UNSORTED_DIR = "unsorted"
REPORTS_DIR = "_reports"

IGNORED_INBOX_NAMES = {".gitkeep", ".keep", "desktop.ini", "thumbs.db"}

IMAGE_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif",
    ".tif", ".tiff", ".gif", ".avif", ".dng", ".cr2", ".cr3", ".arw", ".nef",
}

VIDEO_EXTENSIONS = {".mov", ".mp4", ".m4v"}

# Video classification targets (subset of regions + theme categories).
VIDEO_TARGET_IDS: Tuple[str, ...] = (
    "christchurch",
    "lake-tekapo",
    "mount-cook",
    "kaikoura",
    "milford-sound",
    "guests",
    "cars",
    "food",
    "lodging",
    "stars",
)

VIDEO_KEYFRAME_COUNT = 5
VIDEO_REPORT_NAME = "video-report.md"

# Only copy when confidence >= this; otherwise leave file in place.
CONFIDENCE_THRESHOLD = 0.45

SIGNAL_WEIGHTS = {
    "filename": 0.30,
    "gps": 0.35,
    "ai": 0.35,
}


@dataclass(frozen=True)
class Target:
    folder: str
    label: str
    kind: str  # "region" | "category"
    keywords: Tuple[str, ...]
    center: Optional[Tuple[float, float]] = None
    radius_km: float = 35.0
    ai_hints: Tuple[str, ...] = ()


REGIONS: Dict[str, Target] = {
    "kaikoura": Target(
        folder="kaikoura",
        label="Kaikoura Whale Watching",
        kind="region",
        keywords=("kaikoura", "kaiikoura", "凯库拉", "whale", "观鲸", "seal", "dolphin"),
        center=(-42.401, 173.681),
        radius_km=35,
        ai_hints=("kaikoura coast", "whale watching", "whale tail", "seal colony", "dolphin"),
    ),
    "akaroa": Target(
        folder="akaroa",
        label="Akaroa",
        kind="region",
        keywords=("akaroa", "acaroa", "阿卡罗阿", "法国小镇"),
        center=(-43.803, 172.967),
        radius_km=25,
        ai_hints=("akaroa harbour", "akaroa lighthouse", "french bay settlement"),
    ),
    "lake-tekapo": Target(
        folder="lake-tekapo",
        label="Lake Tekapo",
        kind="region",
        keywords=("tekapo", "lake-tekapo", "lake tekapo", "特卡波", "good shepherd", "lupin"),
        center=(-44.004, 170.477),
        radius_km=30,
        ai_hints=("lake tekapo turquoise", "church of good shepherd", "tekapo lake lupins"),
    ),
    "mount-cook": Target(
        folder="mount-cook",
        label="Mount Cook",
        kind="region",
        keywords=("mount-cook", "mt-cook", "mtcook", "aoraki", "库克山", "hooker", "tasman"),
        center=(-43.734, 170.098),
        radius_km=40,
        ai_hints=("mount cook aoraki", "snowy alps peak", "hooker valley", "tasman glacier lake"),
    ),
    "wanaka": Target(
        folder="wanaka",
        label="Wanaka",
        kind="region",
        keywords=("wanaka", "瓦纳卡", "wanaka tree", "roys peak"),
        center=(-44.700, 169.132),
        radius_km=35,
        ai_hints=("lake wanaka", "wanaka lone tree", "wanaka waterfront mountains"),
    ),
    "queenstown": Target(
        folder="queenstown",
        label="Queenstown",
        kind="region",
        keywords=("queenstown", "qtown", "皇后镇", "remarkables", "gondola", "wakatipu"),
        center=(-45.031, 168.663),
        radius_km=40,
        ai_hints=("queenstown lake wakatipu", "remarkables mountains", "skyline gondola"),
    ),
    "milford-sound": Target(
        folder="milford-sound",
        label="Milford Sound",
        kind="region",
        keywords=("milford", "fiordland", "米尔福德", "mitre peak", "sound", "fiord"),
        center=(-44.641, 167.897),
        radius_km=45,
        ai_hints=("milford sound fiord", "mitre peak", "fiord waterfall cruise"),
    ),
    "moeraki-boulders": Target(
        folder="moeraki-boulders",
        label="Moeraki Boulders",
        kind="region",
        keywords=("moeraki", "boulder", "摩拉基", "大圆石", "spherical rocks"),
        center=(-45.345, 170.826),
        radius_km=20,
        ai_hints=("moeraki boulders spherical rocks beach", "large round boulders coastline"),
    ),
    "hanmer-springs": Target(
        folder="hanmer-springs",
        label="Hanmer Springs",
        kind="region",
        keywords=("hanmer", "汉默", "温泉", "hanmer-springs"),
        center=(-42.522, 172.828),
        radius_km=20,
        ai_hints=("hanmer springs thermal pools", "hot springs resort"),
    ),
    "christchurch": Target(
        folder="christchurch",
        label="Christchurch",
        kind="region",
        keywords=("christchurch", "chc", "基督城", "cathedral", "botanic", "tram"),
        center=(-43.532, 172.636),
        radius_km=45,
        ai_hints=("christchurch city", "canterbury cathedral", "botanic gardens"),
    ),
    "dunedin": Target(
        folder="dunedin",
        label="Dunedin",
        kind="region",
        keywords=("dunedin", "但尼丁", "otago", "larnach", "penguin", "火车站"),
        center=(-45.874, 170.503),
        radius_km=40,
        ai_hints=("dunedin railway station", "larnach castle", "otago peninsula"),
    ),
    "arrowtown": Target(
        folder="arrowtown",
        label="Arrowtown",
        kind="region",
        keywords=("arrowtown", "arrow town", "箭镇", "gold mining", "buckingham"),
        center=(-44.938, 168.743),
        radius_km=15,
        ai_hints=("arrowtown historic village", "autumn arrowtown trees", "buckingham street"),
    ),
    "oamaru": Target(
        folder="oamaru",
        label="Oamaru",
        kind="region",
        keywords=("oamaru", "奥玛鲁", "blue penguin", "yellow-eyed penguin", "victorian"),
        center=(-45.097, 170.971),
        radius_km=25,
        ai_hints=("oamaru victorian buildings", "blue penguin colony", "harbour town"),
    ),
}

CATEGORIES: Dict[str, Target] = {
    "lodging": Target(
        folder="酒店民宿",
        label="酒店民宿",
        kind="category",
        keywords=("hotel", "motel", "lodge", "bnb", "airbnb", "accommodation", "酒店", "民宿", "inn"),
        ai_hints=("hotel room", "bed and breakfast", "lodge motel building interior"),
    ),
    "food": Target(
        folder="美食",
        label="美食",
        kind="category",
        keywords=("food", "meal", "restaurant", "dining", "cafe", "美食", "餐厅", "breakfast", "lunch", "dinner"),
        ai_hints=("restaurant meal plate", "cafe food dish", "dining table food"),
    ),
    "stars": Target(
        folder="星空",
        label="星空",
        kind="category",
        keywords=("star", "stars", "milky", "astro", "night sky", "galaxy", "星空", "银河", "stargazing"),
        ai_hints=("milky way night sky", "star trail astrophotography", "dark sky stars"),
    ),
    "guests": Target(
        folder="客人合影",
        label="客人合影",
        kind="category",
        keywords=("guest", "group", "family", "合影", "客人", "team photo", "tourists", "selfie"),
        ai_hints=("group photo tourists posing", "family travel photo", "people portrait vacation"),
    ),
    "cars": Target(
        folder="奔驰商务车",
        label="奔驰商务车",
        kind="category",
        keywords=("mercedes", "benz", "v-class", "vclass", "奔驰", "商务车", "sprinter", "van"),
        ai_hints=("mercedes benz van", "luxury minivan tour vehicle", "mercedes v-class"),
    ),
}

ALL_TARGETS: Dict[str, Target] = {**REGIONS, **CATEGORIES}

VIDEO_TARGETS: Dict[str, Target] = {tid: ALL_TARGETS[tid] for tid in VIDEO_TARGET_IDS}

# 景点中文文件夹（南岛行程）
SCENIC_TARGET_IDS: Tuple[str, ...] = (
    "kaikoura",
    "akaroa",
    "lake-tekapo",
    "mount-cook",
    "wanaka",
    "queenstown",
    "arrowtown",
    "milford-sound",
    "dunedin",
    "oamaru",
    "christchurch",
)

SCENIC_REPORT_NAME = "scenic-classify-report.md"

SCENIC_SPOTS: Dict[str, Target] = {
    "kaikoura": Target(
        folder="凯库拉观鲸",
        label="凯库拉观鲸",
        kind="region",
        keywords=("kaikoura", "kaiikoura", "凯库拉", "whale", "观鲸", "seal", "dolphin"),
        center=(-42.401, 173.681),
        radius_km=35,
        ai_hints=("kaikoura coast", "whale watching", "whale tail"),
    ),
    "akaroa": Target(
        folder="阿卡罗阿羊驼",
        label="阿卡罗阿羊驼",
        kind="region",
        keywords=("akaroa", "阿卡罗阿", "羊驼", "alpaca", "法国小镇"),
        center=(-43.803, 172.967),
        radius_km=25,
        ai_hints=("akaroa harbour", "alpaca farm", "french bay"),
    ),
    "lake-tekapo": Target(
        folder="蒂卡波湖",
        label="蒂卡波湖",
        kind="region",
        keywords=("tekapo", "lake tekapo", "蒂卡波", "特卡波", "good shepherd", "lupin"),
        center=(-44.004, 170.477),
        radius_km=30,
        ai_hints=("lake tekapo turquoise", "church of good shepherd"),
    ),
    "mount-cook": Target(
        folder="库克山",
        label="库克山",
        kind="region",
        keywords=("mount-cook", "mt-cook", "aoraki", "库克山", "hooker", "tasman"),
        center=(-43.734, 170.098),
        radius_km=40,
        ai_hints=("mount cook aoraki", "snowy alps", "hooker valley"),
    ),
    "wanaka": Target(
        folder="瓦纳卡",
        label="瓦纳卡",
        kind="region",
        keywords=("wanaka", "瓦纳卡", "wanaka tree", "roys peak"),
        center=(-44.700, 169.132),
        radius_km=35,
        ai_hints=("lake wanaka", "wanaka lone tree"),
    ),
    "queenstown": Target(
        folder="皇后镇",
        label="皇后镇",
        kind="region",
        keywords=("queenstown", "皇后镇", "remarkables", "gondola", "wakatipu"),
        center=(-45.031, 168.663),
        radius_km=40,
        ai_hints=("queenstown lake wakatipu", "remarkables"),
    ),
    "arrowtown": Target(
        folder="箭镇",
        label="箭镇",
        kind="region",
        keywords=("arrowtown", "箭镇", "buckingham", "gold mining"),
        center=(-44.938, 168.743),
        radius_km=15,
        ai_hints=("arrowtown village", "autumn trees arrowtown"),
    ),
    "milford-sound": Target(
        folder="米佛峡湾",
        label="米佛峡湾",
        kind="region",
        keywords=("milford", "fiordland", "米尔福德", "米佛", "mitre peak", "峡湾"),
        center=(-44.641, 167.897),
        radius_km=45,
        ai_hints=("milford sound fiord", "mitre peak"),
    ),
    "dunedin": Target(
        folder="但尼丁",
        label="但尼丁",
        kind="region",
        keywords=("dunedin", "但尼丁", "otago", "larnach", "火车站"),
        center=(-45.874, 170.503),
        radius_km=40,
        ai_hints=("dunedin railway station", "larnach castle"),
    ),
    "oamaru": Target(
        folder="奥玛鲁",
        label="奥玛鲁",
        kind="region",
        keywords=("oamaru", "奥玛鲁", "blue penguin", "黄眼企鹅"),
        center=(-45.097, 170.971),
        radius_km=25,
        ai_hints=("oamaru harbour", "blue penguin colony"),
    ),
    "christchurch": Target(
        folder="基督城",
        label="基督城",
        kind="region",
        keywords=("christchurch", "基督城", "chc", "cathedral", "botanic"),
        center=(-43.532, 172.636),
        radius_km=45,
        ai_hints=("christchurch city", "canterbury cathedral"),
    ),
}


def nearest_scenic_region(lat: float, lon: float) -> Optional[Tuple[str, float]]:
    best_id: Optional[str] = None
    best_score = 0.0
    for region_id, target in SCENIC_SPOTS.items():
        if not target.center:
            continue
        dist = haversine_km((lat, lon), target.center)
        if dist <= target.radius_km:
            score = max(0.0, 1.0 - dist / target.radius_km)
            if score > best_score:
                best_id = region_id
                best_score = score
    if best_id is None:
        return None
    return best_id, best_score


def haversine_km(a: Tuple[float, float], b: Tuple[float, float]) -> float:
    lat1, lon1 = radians(a[0]), radians(a[1])
    lat2, lon2 = radians(b[0]), radians(b[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    x = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 6371.0 * 2 * asin(sqrt(x))


def nearest_region(lat: float, lon: float) -> Optional[Tuple[str, float]]:
    best_id: Optional[str] = None
    best_score = 0.0
    for region_id, target in REGIONS.items():
        if not target.center:
            continue
        dist = haversine_km((lat, lon), target.center)
        if dist <= target.radius_km:
            score = max(0.0, 1.0 - dist / target.radius_km)
            if score > best_score:
                best_id = region_id
                best_score = score
    if best_id is None:
        return None
    return best_id, best_score
