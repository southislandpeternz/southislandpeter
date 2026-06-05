#!/usr/bin/env node
/**
 * Pick 2 best photos per Xiaohongshu curated category and copy into 网页使用照片集.
 * Run: node scripts/generate-xhs-showcase.mjs
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DESKTOP_LIB =
  "/Users/yueshe/Desktop/NZ-Travel-photos /小红书素材库";
const WEB_ROOT = path.join(ROOT, "images/网页使用照片集");
const OUT_DIR = path.join(WEB_ROOT, "xiaohongshu-showcase");
const MANIFEST_PATH = path.join(ROOT, "gallery/xhs-showcase.json");
const PYTHON = path.join(ROOT, ".venv-photo-organizer/bin/python");
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|gif|avif)$/i;

const CATEGORIES = [
  { slug: "lake", folder: "小红书-湖景精选", label: "湖景" },
  { slug: "whale", folder: "小红书-观鲸精选", label: "观鲸" },
  { slug: "vehicle", folder: "小红书-奔驰商务车精选", label: "奔驰商务车" },
  { slug: "guests", folder: "小红书-客户合影精选", label: "客户合影" }
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

function md5File(filePath) {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash("md5").update(buf).digest("hex");
}

function listPhotos(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f) && f !== ".DS_Store")
    .map((f) => path.join(dir, f));
}

function pickTopTwo(files) {
  const scoreScript = `
import sys, json, hashlib
from pathlib import Path
try:
    import cv2
    import numpy as np
except ImportError:
    print(json.dumps({"error": "cv2 missing"}))
    sys.exit(1)

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

paths = sys.argv[1:]
rows = []
seen = set()
for p in paths:
    try:
        digest = md5(p)
    except OSError:
        continue
    if digest in seen:
        continue
    seen.add(digest)
    rows.append({"path": p, "score": score(p), "md5": digest})

rows.sort(key=lambda r: r["score"], reverse=True)
print(json.dumps(rows[:2]))
`;
  const tmp = path.join(ROOT, ".tmp-xhs-score.py");
  fs.writeFileSync(tmp, scoreScript);
  try {
    const out = execSync(`"${PYTHON}" "${tmp}" ${files.map((f) => `"${f}"`).join(" ")}`, {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024
    });
    const rows = JSON.parse(out.trim());
    if (rows.error) throw new Error(rows.error);
    return rows;
  } finally {
    fs.unlinkSync(tmp);
  }
}

function safeName(srcPath, slug, index) {
  const ext = path.extname(srcPath).toLowerCase() || ".jpg";
  const normalized = ext === ".jpeg" ? ".jpg" : ext;
  return `${slug}-${index + 1}${normalized}`;
}

function main() {
  if (!fs.existsSync(DESKTOP_LIB)) {
    console.error(`Missing curated library: ${DESKTOP_LIB}`);
    process.exit(1);
  }
  if (!fs.existsSync(PYTHON)) {
    console.error(`Missing Python venv: ${PYTHON}`);
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const thumbsDir = path.join(OUT_DIR, "thumbs");
  fs.mkdirSync(thumbsDir, { recursive: true });

  const images = [];

  for (const cat of CATEGORIES) {
    const srcDir = path.join(DESKTOP_LIB, cat.folder);
    const files = listPhotos(srcDir);
    if (!files.length) {
      console.warn(`No photos in ${cat.folder}`);
      continue;
    }
    const top = pickTopTwo(files);
    console.log(`\n=== ${cat.label} (${top.length} selected) ===`);
    top.forEach((row, i) => {
      const destName = safeName(row.path, cat.slug, i);
      const destFull = path.join(OUT_DIR, destName);
      const destThumb = path.join(thumbsDir, destName);
      fs.copyFileSync(row.path, destFull);
      makeThumb(destFull, destThumb, 720);
      const relFull = `images/网页使用照片集/xiaohongshu-showcase/${destName}`;
      const relThumb = `images/网页使用照片集/xiaohongshu-showcase/thumbs/${destName}`;
      images.push({
        category: cat.slug,
        label: cat.label,
        file: destName,
        score: row.score,
        full: relFull,
        thumbUrl: relThumb,
        alt: `Peter 南岛旅拍 · ${cat.label}`
      });
      console.log(`  ${destName} (score ${row.score.toFixed(1)})`);
    });
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    photosRoot: "images/网页使用照片集/xiaohongshu-showcase",
    imageCount: images.length,
    images
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nManifest: ${MANIFEST_PATH}`);
  console.log(`Total: ${images.length} photos`);
}

main();
