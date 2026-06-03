#!/usr/bin/env node
/**
 * Scans images/网页使用照片集/ for review*.jpg / reviews*.jpg and writes manifest + thumbs.
 * Run after adding images: node scripts/generate-reviews-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const REVIEWS_DIR = "images/网页使用照片集";
const THUMBS_DIR = path.join(REVIEWS_DIR, "thumbs");

const REVIEW_FILE_RE = /^(review|reviews).+\.(jpe?g)$/i;

function hasSips() {
  try {
    execSync("which sips", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function makeThumb(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (hasSips()) {
    execSync(`sips -Z 560 "${src}" --out "${dest}"`, { stdio: "ignore" });
    return;
  }
  fs.copyFileSync(src, dest);
}

const files = fs
  .readdirSync(REVIEWS_DIR)
  .filter((name) => {
    if (name.startsWith(".") || name === "manifest.json" || name === "thumbs") {
      return false;
    }
    return REVIEW_FILE_RE.test(name);
  })
  .map((file) => {
    const src = path.join(REVIEWS_DIR, file);
    const stat = fs.statSync(src);
    return { file, mtime: stat.mtimeMs };
  })
  .sort((a, b) => b.mtime - a.mtime);

const images = files.map(({ file, mtime }) => {
  const src = path.join(REVIEWS_DIR, file);
  const thumbPath = path.join(THUMBS_DIR, file);
  makeThumb(src, thumbPath);
  return {
    file,
    thumb: `thumbs/${file}`,
    mtime,
    width: 560
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceDir: REVIEWS_DIR,
  count: images.length,
  images
};

fs.writeFileSync(
  path.join(REVIEWS_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(`Wrote ${images.length} review images to ${REVIEWS_DIR}/manifest.json`);
