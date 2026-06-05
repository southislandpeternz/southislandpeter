#!/usr/bin/env node
/**
 * Pick 24 curated homepage travel photos (3 per priority theme).
 * Run: node scripts/generate-xhs-showcase.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DESKTOP = "/Users/yueshe/Desktop/NZ-Travel-photos ";
const DESKTOP_LIB = path.join(DESKTOP, "小红书素材库");
const WEB_ROOT = path.join(ROOT, "images/网页使用照片集");
const OUT_DIR = path.join(WEB_ROOT, "xiaohongshu-showcase");
const MANIFEST_PATH = path.join(ROOT, "gallery/xhs-showcase.json");
const PYTHON = path.join(ROOT, ".venv-photo-organizer/bin/python");
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|gif|avif)$/i;
const TARGET_TOTAL = 24;

const CATEGORIES = [
  {
    slug: "mount-cook",
    label: "库克山",
    count: 3,
    sources: [
      path.join(DESKTOP, "mount-cook"),
      path.join(DESKTOP_LIB, "小红书-雪山精选")
    ]
  },
  {
    slug: "lake-pukaki",
    label: "普卡基湖",
    count: 3,
    sources: [
      path.join(DESKTOP, "lake-pukaki"),
      path.join(DESKTOP, "lake-pukali"),
      path.join(DESKTOP_LIB, "小红书-湖景精选")
    ]
  },
  {
    slug: "lake-tekapo",
    label: "特卡波",
    count: 3,
    sources: [
      path.join(DESKTOP, "lake-tekapo"),
      path.join(DESKTOP, "Lake -tekapo"),
      path.join(DESKTOP_LIB, "小红书-湖景精选")
    ]
  },
  {
    slug: "kaikoura",
    label: "凯库拉观鲸",
    count: 3,
    sources: [
      path.join(DESKTOP, "kaikoura"),
      path.join(DESKTOP, "kaikoura "),
      path.join(DESKTOP_LIB, "小红书-观鲸精选")
    ]
  },
  {
    slug: "milford-sound",
    label: "米尔福德峡湾",
    count: 3,
    sources: [path.join(DESKTOP, "milford-sound")]
  },
  {
    slug: "queenstown",
    label: "皇后镇",
    count: 3,
    sources: [path.join(DESKTOP, "queenstown")]
  },
  {
    slug: "vehicle",
    label: "奔驰商务车",
    count: 3,
    sources: [path.join(DESKTOP_LIB, "小红书-奔驰商务车精选")]
  },
  {
    slug: "guests",
    label: "客人合影",
    count: 3,
    sources: [path.join(DESKTOP_LIB, "小红书-客户合影精选")]
  }
];

function hasSips() {
  try {
    execSync("which sips", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function makeThumb(src, dest, size) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (hasSips()) {
    execSync(`sips -Z ${size} "${src}" --out "${dest}"`, { stdio: "ignore" });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function listPhotosRecursive(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (IMAGE_EXT.test(entry.name)) out.push(full);
    }
  };
  walk(dir);
  return out;
}

function collectSources(sources) {
  const files = [];
  for (const src of sources) files.push(...listPhotosRecursive(src));
  return files;
}

function pickTopN(files, count, excludeMd5) {
  if (!files.length || count <= 0) return [];
  const scoreScript = `
import sys, json, hashlib
from pathlib import Path
try:
    import cv2
    import numpy as np
except ImportError:
    print(json.dumps({"error": "cv2 missing"}))
    sys.exit(1)

exclude = set(sys.argv[1].split(",")) if len(sys.argv) > 1 and sys.argv[1] else set()
paths = sys.argv[2:]

def md5(p):
    h = hashlib.md5()
    with open(p, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()

def score(path):
    p = Path(path)
    try:
        data = np.fromfile(str(p), dtype=np.uint8)
        img = cv2.imdecode(data, cv2.IMREAD_COLOR)
        if img is None:
            return 0.0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        lap = cv2.Laplacian(gray, cv2.CV_64F).var()
        h, w = img.shape[:2]
        mp = (w * h) / 1e6
        return float(lap) * 0.6 + mp * 40
    except Exception:
        return 0.0

rows = []
seen = set()
for p in paths:
    try:
        digest = md5(p)
    except OSError:
        continue
    if digest in seen or digest in exclude:
        continue
    seen.add(digest)
    rows.append({"path": p, "score": score(p), "md5": digest})

rows.sort(key=lambda r: r["score"], reverse=True)
print(json.dumps(rows[:${count}]))
`;
  const tmp = path.join(ROOT, ".tmp-xhs-score.py");
  fs.writeFileSync(tmp, scoreScript);
  try {
    const excludeArg = [...excludeMd5].join(",");
    const out = execSync(
      `"${PYTHON}" "${tmp}" "${excludeArg}" ${files.map((f) => `"${f}"`).join(" ")}`,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    const rows = JSON.parse(out.trim());
    if (rows.error) throw new Error(rows.error);
    return rows;
  } finally {
    fs.unlinkSync(tmp);
  }
}

function safeName(slug, index) {
  return `${slug}-${index + 1}.jpg`;
}

function clearShowcaseDir() {
  if (!fs.existsSync(OUT_DIR)) return;
  for (const entry of fs.readdirSync(OUT_DIR)) {
    const full = path.join(OUT_DIR, entry);
    if (entry === "thumbs") {
      for (const f of fs.readdirSync(full)) fs.unlinkSync(path.join(full, f));
    } else {
      fs.unlinkSync(full);
    }
  }
}

function main() {
  if (!fs.existsSync(PYTHON)) {
    console.error(`Missing Python venv: ${PYTHON}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "thumbs"), { recursive: true });
  clearShowcaseDir();

  const images = [];
  const usedMd5 = new Set();

  for (const cat of CATEGORIES) {
    const files = collectSources(cat.sources);
    if (!files.length) {
      console.warn(`No photos for ${cat.label}`);
      continue;
    }
    const top = pickTopN(files, cat.count, usedMd5);
    console.log(`\n=== ${cat.label} (${top.length}/${cat.count}) ===`);
    top.forEach((row, i) => {
      usedMd5.add(row.md5);
      const destName = safeName(cat.slug, i);
      const destFull = path.join(OUT_DIR, destName);
      const destThumb = path.join(OUT_DIR, "thumbs", destName);
      fs.copyFileSync(row.path, destFull);
      makeThumb(destFull, destThumb, 720);
      images.push({
        category: cat.slug,
        label: cat.label,
        file: destName,
        score: row.score,
        full: `images/网页使用照片集/xiaohongshu-showcase/${destName}`,
        thumbUrl: `images/网页使用照片集/xiaohongshu-showcase/thumbs/${destName}`,
        alt: `Peter 南岛旅拍 · ${cat.label}`
      });
      console.log(`  ${destName} (score ${row.score.toFixed(1)})`);
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    photosRoot: "images/网页使用照片集/xiaohongshu-showcase",
    imageCount: images.length,
    targetCount: TARGET_TOTAL,
    images
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nManifest: ${MANIFEST_PATH}`);
  console.log(`Total: ${images.length} photos (target ${TARGET_TOTAL})`);
}

main();
