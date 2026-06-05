"""Extract GPS coordinates from image EXIF (Pillow, exiftool, or macOS mdls)."""

from __future__ import annotations

import re
import subprocess
from fractions import Fraction
from pathlib import Path
from typing import Optional, Tuple


def _ratio_to_float(value) -> Optional[float]:
    if value is None:
        return None
    if isinstance(value, (int, float)):
        return float(value)
    try:
        if hasattr(value, "numerator"):
            return float(value.numerator) / float(value.denominator or 1)
    except (TypeError, ZeroDivisionError):
        pass
    if isinstance(value, tuple) and len(value) == 2:
        num, den = value
        return float(num) / float(den or 1)
    if isinstance(value, str):
        if "/" in value:
            a, b = value.split("/", 1)
            return float(a) / float(b or 1)
        return float(value)
    return None


def _dms_to_decimal(dms, ref: str) -> Optional[float]:
    if not dms or len(dms) < 3:
        return None
    deg = _ratio_to_float(dms[0])
    minutes = _ratio_to_float(dms[1])
    seconds = _ratio_to_float(dms[2])
    if deg is None or minutes is None or seconds is None:
        return None
    decimal = deg + minutes / 60.0 + seconds / 3600.0
    ref = (ref or "").upper()
    if ref in ("S", "W"):
        decimal = -decimal
    return decimal


def _gps_from_pillow(path: Path) -> Optional[Tuple[float, float]]:
    try:
        from PIL import Image
        from PIL.ExifTags import GPSTAGS, TAGS
    except ImportError:
        return None

    try:
        with Image.open(path) as img:
            exif = img.getexif()
            if not exif:
                return None
            gps_info = exif.get_ifd(0x8825) if hasattr(exif, "get_ifd") else None
            if not gps_info:
                # Legacy API
                raw = exif.get(34853)
                if not raw:
                    return None
                gps_info = {GPSTAGS.get(k, k): v for k, v in raw.items()}
            else:
                gps_info = {GPSTAGS.get(k, k): v for k, v in gps_info.items()}

            lat = _dms_to_decimal(gps_info.get("GPSLatitude"), gps_info.get("GPSLatitudeRef", "N"))
            lon = _dms_to_decimal(gps_info.get("GPSLongitude"), gps_info.get("GPSLongitudeRef", "E"))
            if lat is None or lon is None:
                return None
            return lat, lon
    except Exception:
        return None


def _gps_from_exiftool(path: Path) -> Optional[Tuple[float, float]]:
    try:
        proc = subprocess.run(
            ["exiftool", "-n", "-GPSLatitude", "-GPSLongitude", str(path)],
            capture_output=True,
            text=True,
            timeout=15,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    if proc.returncode != 0:
        return None
    lat = lon = None
    for line in proc.stdout.splitlines():
        if line.startswith("GPS Latitude"):
            lat = float(line.split(":", 1)[1].strip())
        elif line.startswith("GPS Longitude"):
            lon = float(line.split(":", 1)[1].strip())
    if lat is None or lon is None:
        return None
    return lat, lon


def _gps_from_mdls(path: Path) -> Optional[Tuple[float, float]]:
    try:
        proc = subprocess.run(
            ["mdls", "-name", "kMDItemLatitude", "-name", "kMDItemLongitude", str(path)],
            capture_output=True,
            text=True,
            timeout=10,
        )
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return None
    lat = lon = None
    for line in proc.stdout.splitlines():
        if "kMDItemLatitude" in line:
            m = re.search(r"=\s*(-?\d+(?:\.\d+)?)", line)
            if m:
                lat = float(m.group(1))
        elif "kMDItemLongitude" in line:
            m = re.search(r"=\s*(-?\d+(?:\.\d+)?)", line)
            if m:
                lon = float(m.group(1))
    if lat is None or lon is None:
        return None
    return lat, lon


def read_gps(path: Path) -> Optional[Tuple[float, float]]:
    for reader in (_gps_from_pillow, _gps_from_exiftool, _gps_from_mdls):
        coords = reader(path)
        if coords:
            return coords
    return None
