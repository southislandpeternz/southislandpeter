#!/usr/bin/env node
/**
 * Scans images/网页使用照片集/reviews/ and writes manifest + thumbs.
 * Run: node scripts/generate-reviews-manifest.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const WEB_ROOT = "images/网页使用照片集";
const REVIEWS_DIR = path.join(WEB_ROOT, "reviews");
const LEGACY_DIR = WEB_ROOT;
const THUMBS_DIR = path.join(REVIEWS_DIR, "thumbs");
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** Platform tags for homepage diversity (wechat / xhs / google). */
const PLATFORM_TAGS = {
  "review-guide-01.jpg": ["xhs", "wechat", "google"],
  "review-return-return-01.JPG": ["wechat", "xhs"],
  "review-service-service-01.JPG": ["google", "wechat"],
  "reviews-driving-driving-01.JPG": ["wechat", "google"],
  "reviews-driving-driving-02.JPG": ["xhs", "wechat"],
  "reviews-photo-photo-01.JPG": ["xhs", "wechat"],
  "reviews-service-service-02.JPG": ["xhs"],
  "reviews-service-service-03.JPG": ["wechat", "xhs"],
  "reviews-service-service-04.JPG": ["google", "wechat"]
};

const PLATFORM_LABELS = {
  wechat: "微信",
  xhs: "小红书",
  google: "Google Review"
};

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

function ensureReviewsDir() {
  fs.mkdirSync(REVIEWS_DIR, { recursive: true });
  fs.mkdirSync(THUMBS_DIR, { recursive: true });

  if (!fs.existsSync(LEGACY_DIR)) return;
  for (const entry of fs.readdirSync(LEGACY_DIR, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const name = entry.name;
    if (!IMAGE_EXT.test(name)) continue;
    if (!/^(review|reviews)/i.test(name)) continue;
    const dest = path.join(REVIEWS_DIR, name);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(LEGACY_DIR, name), dest);
    }
  }
}

function listReviewFiles() {
  ensureReviewsDir();
  return fs
    .readdirSync(REVIEWS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && IMAGE_EXT.test(entry.name))
    .map((entry) => {
      const file = entry.name;
      const src = path.join(REVIEWS_DIR, file);
      const stat = fs.statSync(src);
      const platforms = PLATFORM_TAGS[file] || ["wechat"];
      const primary = platforms[0];
      return {
        file,
        mtime: stat.mtimeMs,
        platforms,
        platform: primary,
        platformLabel: PLATFORM_LABELS[primary] || "客人评价",
        alt: `客人好评 · ${PLATFORM_LABELS[primary] || "评价"}`
      };
    })
    .sort((a, b) => b.mtime - a.mtime);
}

const files = listReviewFiles();

const images = files.map(({ file, mtime, platforms, platform, platformLabel, alt }) => {
  const src = path.join(REVIEWS_DIR, file);
  const thumbPath = path.join(THUMBS_DIR, file);
  makeThumb(src, thumbPath);
  return {
    file,
    thumb: `thumbs/${file}`,
    mtime,
    width: 560,
    platforms,
    platform,
    platformLabel,
    alt,
    full: `${REVIEWS_DIR}/${file}`,
    thumbUrl: `${REVIEWS_DIR}/thumbs/${file}`
  };
});

const manifest = {
  generatedAt: new Date().toISOString(),
  sourceDir: REVIEWS_DIR,
  homepageLimit: 12,
  count: images.length,
  images
};

fs.writeFileSync(path.join(WEB_ROOT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`Wrote ${images.length} review images to ${WEB_ROOT}/manifest.json`);
