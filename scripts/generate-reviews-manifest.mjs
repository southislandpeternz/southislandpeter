#!/usr/bin/env node
/**
 * Scans images/reviews/ and writes manifest.json + WebP/JPEG thumbnails.
 * Run: node scripts/generate-reviews-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const REVIEWS_DIR = "images/reviews";
const THUMBS_DIR = path.join(REVIEWS_DIR, "thumbs");
const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);

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
    if (name.startsWith(".") || name === "manifest.json" || name === "thumbs") return false;
    return EXT.has(path.extname(name));
  })
  .sort((a, b) => a.localeCompare(b, "en"));

const images = files.map((file) => {
  const src = path.join(REVIEWS_DIR, file);
  const thumbName = file;
  const thumbPath = path.join(THUMBS_DIR, thumbName);
  makeThumb(src, thumbPath);
  return {
    file,
    thumb: `thumbs/${thumbName}`,
    width: 560
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  count: images.length,
  images
};

fs.writeFileSync(
  path.join(REVIEWS_DIR, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(`Wrote ${images.length} review images to ${REVIEWS_DIR}/manifest.json`);
