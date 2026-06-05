#!/usr/bin/env node
/**
 * Pick 24 curated homepage travel photos — 雪山/湖泊/奔驰/客人合影 focus.
 * Run: node scripts/generate-xhs-showcase.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DESKTOP = "/Users/yueshe/Desktop/NZ-Travel-photos ";
const DESKTOP_LIB = path.join(DESKTOP, "小红书素材库");
const WEB_ROOT = path.join(ROOT, "images/网页使用照片集");
const SITE_ROOT = path.join(WEB_ROOT, "site");
const OUT_DIR = path.join(WEB_ROOT, "xiaohongshu-showcase");
const MANIFEST_PATH = path.join(ROOT, "gallery/xhs-showcase.json");
const SCORE_PY = path.join(ROOT, "scripts/xhs-showcase-score.py");
const PURGE_PY = path.join(ROOT, "scripts/purge-source-photos.py");
const PYTHON = path.join(ROOT, ".venv-photo-organizer/bin/python");
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|gif|avif)$/i;
const TARGET_TOTAL = 24;

const LAKE_SLUGS = new Set(["lake-pukaki", "lake-tekapo", "tekapo-stars"]);
const PERSON_SLUGS = new Set(["guests"]);

/** 雪山 · 湖泊 · 奔驰 · 客人合影 = 24 */
const CATEGORIES = [
  {
    slug: "mount-cook",
    label: "库克山",
    count: 6,
    sources: [
      path.join(DESKTOP, "mount-cook"),
      path.join(DESKTOP_LIB, "小红书-雪山精选")
    ]
  },
  {
    slug: "lake-pukaki",
    label: "普卡基湖",
    count: 4,
    sources: [path.join(DESKTOP, "lake-pukaki"), path.join(DESKTOP, "lake-pukali")]
  },
  {
    slug: "lake-tekapo",
    label: "特卡波湖",
    count: 2,
    sources: [
      path.join(DESKTOP, "lake-tekapo"),
      path.join(DESKTOP, "Lake -tekapo"),
      path.join(DESKTOP_LIB, "小红书-湖景精选")
    ]
  },
  {
    slug: "tekapo-stars",
    label: "特卡波星空",
    count: 1,
    sources: [path.join(DESKTOP, "星空")],
    extraFiles: [path.join(SITE_ROOT, "tekapo-stargazing.JPG")]
  },
  {
    slug: "vehicle",
    label: "奔驰商务车",
    count: 6,
    sources: [
      path.join(DESKTOP_LIB, "小红书-奔驰商务车精选"),
      path.join(DESKTOP, "奔驰商务车")
    ]
  },
  {
    slug: "guests",
    label: "客人合影",
    count: 5,
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
  return [...new Set(files)];
}

function rankCandidates(category, files, exclude) {
  if (!files.length) return [];
  const excludeFile = path.join(ROOT, ".tmp-xhs-exclude.json");
  fs.writeFileSync(excludeFile, JSON.stringify(exclude));
  try {
    const out = execSync(
      `"${PYTHON}" "${SCORE_PY}" "${category}" "${excludeFile}" ${files.map((f) => `"${f}"`).join(" ")}`,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    const rows = JSON.parse(out.trim());
    if (rows.error) throw new Error(rows.error);
    return rows;
  } finally {
    fs.unlinkSync(excludeFile);
  }
}

function interleaveGroup(category) {
  if (LAKE_SLUGS.has(category)) return "lake";
  if (PERSON_SLUGS.has(category)) return "guests";
  return category;
}

function interleaveImages(items) {
  const buckets = {};
  for (const img of items) {
    const g = interleaveGroup(img.category);
    (buckets[g] ||= []).push(img);
  }
  for (const g of Object.keys(buckets)) {
    buckets[g].sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  const order = ["mount-cook", "lake", "vehicle", "guests"];
  const keys = order.filter((k) => buckets[k]?.length);
  const out = [];
  let guard = 0;
  while (out.length < items.length && guard < items.length * 4) {
    guard += 1;
    let added = false;
    for (const k of keys) {
      if (!buckets[k]?.length) continue;
      const last = out[out.length - 1];
      const next = buckets[k][0];
      if (last && interleaveGroup(last.category) === interleaveGroup(next.category)) {
        continue;
      }
      out.push(buckets[k].shift());
      added = true;
    }
    if (!added) {
      for (const k of keys) {
        if (buckets[k]?.length) {
          out.push(buckets[k].shift());
          break;
        }
      }
    }
  }
  return out;
}

function assignLayouts(items) {
  const heroes = new Set(
    [...items].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 8).map((i) => i.file)
  );
  return items.map((img, idx) => {
    let layout = "standard";
    if (heroes.has(img.file)) {
      if (idx % 5 === 0) layout = "hero";
      else if (idx % 5 === 2) layout = "wide";
    }
    return { ...img, layout };
  });
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

function trackExclude(exclude, row) {
  exclude.md5.push(row.md5);
  exclude.dhash.push(row.dhash);
  if (row.person_dhash) exclude.person_dhash.push(row.person_dhash);
}

function purgeSources() {
  const dirs = [
    ...new Set(CATEGORIES.flatMap((cat) => cat.sources).concat([path.join(DESKTOP, "小红书素材库")]))
  ].filter((d) => fs.existsSync(d));
  if (!dirs.length) return;
  console.log("\n=== Purging text/flight screenshots & duplicates ===");
  execSync(
    `"${PYTHON}" "${PURGE_PY}" ${dirs.map((d) => `"${d}"`).join(" ")}`,
    { stdio: "inherit", maxBuffer: 64 * 1024 * 1024 }
  );
}

function main() {
  if (!fs.existsSync(PYTHON)) {
    console.error(`Missing Python venv: ${PYTHON}`);
    process.exit(1);
  }

  purgeSources();

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(path.join(OUT_DIR, "thumbs"), { recursive: true });
  clearShowcaseDir();

  const raw = [];
  const exclude = { md5: [], dhash: [], person_dhash: [] };

  for (const cat of CATEGORIES) {
    const files = [
      ...collectSources(cat.sources),
      ...(cat.extraFiles || []).filter((f) => fs.existsSync(f))
    ];
    const uniqueFiles = [...new Set(files)];
    if (!uniqueFiles.length) {
      console.warn(`No photos for ${cat.label}`);
      continue;
    }
    const ranked = rankCandidates(cat.slug, uniqueFiles, exclude);
    const top = ranked.slice(0, cat.count);
    console.log(`\n=== ${cat.label} (${top.length}/${cat.count}) ===`);
    top.forEach((row, i) => {
      trackExclude(exclude, row);
      const destName = safeName(cat.slug, i);
      const destFull = path.join(OUT_DIR, destName);
      const destThumb = path.join(OUT_DIR, "thumbs", destName);
      fs.copyFileSync(row.path, destFull);
      makeThumb(destFull, destThumb, 720);
      raw.push({
        category: cat.slug,
        label: cat.label,
        file: destName,
        score: row.score,
        source: path.basename(row.path),
        full: `images/网页使用照片集/xiaohongshu-showcase/${destName}`,
        thumbUrl: `images/网页使用照片集/xiaohongshu-showcase/thumbs/${destName}`,
        alt: `Peter 南岛旅拍 · ${cat.label}`
      });
      console.log(`  ${destName} <- ${path.basename(row.path)}`);
    });
  }

  const images = assignLayouts(interleaveImages(raw));

  const manifest = {
    generatedAt: new Date().toISOString(),
    photosRoot: "images/网页使用照片集/xiaohongshu-showcase",
    imageCount: images.length,
    targetCount: TARGET_TOTAL,
    focus: ["雪山", "湖泊", "奔驰商务车", "客人合影"],
    filters: [
      "purge_text_screenshots",
      "purge_flight_screenshots",
      "purge_duplicates",
      "no_text_screenshots",
      "no_near_duplicates",
      "no_duplicate_people",
      "interleaved_categories"
    ],
    images
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`\nTotal: ${images.length} (interleaved display order in manifest)`);
}

main();
