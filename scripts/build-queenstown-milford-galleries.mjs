#!/usr/bin/env node
/**
 * Build curated Photo Library + gallery JSON for Queenstown & Milford Sound day tours.
 * Does NOT modify any HTML pages.
 *
 * Run: node scripts/build-queenstown-milford-galleries.mjs
 *      node scripts/build-queenstown-milford-galleries.mjs --force
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const ASSIGNMENTS_PATH = path.join(ROOT, "scripts/queenstown-milford-assignments.json");
const FORCE = process.argv.includes("--force");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

const DESTINATIONS = {
  queenstown: {
    key: "queenstown",
    tour: "Queenstown Day Tour",
    tourZh: "皇后镇一日游",
    libraryRoot: "Photo Library/Queenstown-Day-Tour",
    outJson: path.join(ROOT, "gallery/queenstown-day-tour.json"),
    categories: [
      { id: "01-Hero", slug: "hero", titleZh: "主视觉", titleEn: "Hero", sectionZh: "皇后镇主视觉", sectionEn: "Queenstown Hero Shots", keywords: ["Queenstown hero", "Lake Wakatipu banner", "皇后镇主图", "瓦卡蒂普湖"] },
      { id: "02-Lake-Wakatipu", slug: "lake-wakatipu", titleZh: "瓦卡蒂普湖", titleEn: "Lake Wakatipu", sectionZh: "瓦卡蒂普湖风光", sectionEn: "Lake Wakatipu Scenery", keywords: ["Lake Wakatipu", "TSS Earnslaw", "瓦卡蒂普湖", "蒸汽船"] },
      { id: "03-Skyline-Gondola", slug: "skyline-gondola", titleZh: "天空缆车", titleEn: "Skyline Gondola", sectionZh: "鲍勃峰天空缆车", sectionEn: "Bob's Peak Skyline Gondola", keywords: ["Skyline Gondola Queenstown", "Bob's Peak", "天空缆车", "鲍勃峰"] },
      { id: "04-Adventure-Activities", slug: "adventure-activities", titleZh: "冒险活动", titleEn: "Adventure Activities", sectionZh: "皇后镇冒险体验", sectionEn: "Queenstown Adventure", keywords: ["Shotover Jet", "Queenstown adventure", "喷射快艇", "冒险活动"] },
      { id: "05-Town-Centre", slug: "town-centre", titleZh: "小镇中心", titleEn: "Town Centre", sectionZh: "皇后镇湖滨与街道", sectionEn: "Queenstown Town Centre", keywords: ["Queenstown waterfront", "town centre", "皇后镇湖滨", "小镇中心"] },
      { id: "06-Food-Experiences", slug: "food-experiences", titleZh: "美食体验", titleEn: "Food & Experiences", sectionZh: "美食与农场体验", sectionEn: "Food & Farm Experiences", keywords: ["Queenstown dining", "Bluff oysters", "皇后镇美食", "生蚝"] }
    ]
  },
  milford: {
    key: "milford",
    tour: "Milford Sound Day Tour",
    tourZh: "米尔福德峡湾一日游",
    libraryRoot: "Photo Library/Milford-Sound-Day-Tour",
    outJson: path.join(ROOT, "gallery/milford-sound-day-tour.json"),
    categories: [
      { id: "01-Hero", slug: "hero", titleZh: "主视觉", titleEn: "Hero", sectionZh: "峡湾主视觉", sectionEn: "Milford Sound Hero Shots", keywords: ["Milford Sound hero", "Mitre Peak", "米尔福德峡湾", "教冠峰"] },
      { id: "02-Cruise-Experience", slug: "cruise-experience", titleZh: "游船体验", titleEn: "Cruise Experience", sectionZh: "峡湾游船巡游", sectionEn: "Milford Sound Cruise", keywords: ["Milford Sound cruise", "fiord boat tour", "峡湾游船", "巡游"] },
      { id: "03-Fiord-Scenery", slug: "fiord-scenery", titleZh: "峡湾风光", titleEn: "Fiord Scenery", sectionZh: "峡湾自然风景", sectionEn: "Fiord Scenery", keywords: ["Milford Sound scenery", "fiord landscape", "峡湾风光", "教冠峰"] },
      { id: "04-Waterfalls", slug: "waterfalls", titleZh: "瀑布", titleEn: "Waterfalls", sectionZh: "峡湾瀑布", sectionEn: "Milford Waterfalls", keywords: ["Milford Sound waterfalls", "Lady Bowen Falls", "峡湾瀑布", "波文夫人瀑布"] },
      { id: "05-Scenic-Viewpoints", slug: "scenic-viewpoints", titleZh: "观景点", titleEn: "Scenic Viewpoints", sectionZh: "沿途观景点", sectionEn: "Scenic Viewpoints", keywords: ["Milford Road", "Mirror Lakes", "米尔福德公路", "镜湖"] },
      { id: "06-Wildlife", slug: "wildlife", titleZh: "野生动物", titleEn: "Wildlife", sectionZh: "Kea 与野生动物", sectionEn: "Wildlife", keywords: ["kea parrot", "Milford wildlife", "Kea", "高山鹦鹉"] }
    ]
  }
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function optimizeWebImage(filePath) {
  const outPath = filePath.replace(/\.(png|jpeg|jpg)$/i, ".jpg");
  try {
    execSync(
      `python3 -c "
import sys
from PIL import Image
path = sys.argv[1]
out = sys.argv[2]
im = Image.open(path)
im.thumbnail((1920, 1920), Image.LANCZOS)
im.convert('RGB').save(out, 'JPEG', quality=85, optimize=True)
" "${filePath}" "${outPath}"`,
      { stdio: "pipe" }
    );
    if (outPath !== filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (err) {
    console.warn(`[optimize] kept original for ${path.basename(filePath)}: ${err.message}`);
  }
}

function buildAlt(titleEn, titleZh, tour, tourZh) {
  return `${titleEn} — ${tour}, South Island, New Zealand | ${titleZh} · ${tourZh}`;
}

function seedDestination(destConfig, sourceRoot, assignments, heroCandidates) {
  const libraryRoot = path.join(ROOT, destConfig.libraryRoot);
  for (const cat of destConfig.categories) {
    ensureDir(path.join(libraryRoot, cat.id));
  }

  const assignedDests = new Set(assignments.map((a) => a.dest));
  let copied = 0;
  let missing = 0;

  for (const item of assignments) {
    const src = path.join(sourceRoot, item.source);
    const dest = path.join(libraryRoot, item.category, item.dest);
    if (!fs.existsSync(src)) {
      console.warn(`[seed] missing source: ${item.source}`);
      missing++;
      continue;
    }
    ensureDir(path.dirname(dest));
    if (fs.existsSync(dest) && !FORCE) {
      copied++;
      continue;
    }
    fs.copyFileSync(src, dest);
    optimizeWebImage(dest);
    console.log(`[seed] ${destConfig.key}/${item.category}/${item.dest}`);
    copied++;
  }

  for (const cat of destConfig.categories) {
    const dir = path.join(libraryRoot, cat.id);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!IMAGE_EXT.test(file)) continue;
      if (!assignedDests.has(file)) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`[prune] removed ${cat.id}/${file}`);
      }
    }
  }

  return { copied, missing, libraryRoot };
}

function scanCategory(category, libraryRoot, destConfig) {
  const dir = path.join(libraryRoot, category.id);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort((a, b) => a.localeCompare(b, "en"))
    .map((file, index) => {
      const rel = `${destConfig.libraryRoot}/${category.id}/${file}`;
      const assignment = null; // filled by caller if needed
      return { file, path: rel, url: encodeURI(rel), order: index + 1, isPrimary: index === 0, assignment };
    });
}

function buildManifest(destConfig, assignments, heroCandidates, libraryRoot) {
  const assignmentByDest = Object.fromEntries(assignments.map((a) => [a.dest, a]));

  const categories = destConfig.categories.map((category) => {
    const dir = path.join(libraryRoot, category.id);
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f)).sort((a, b) => a.localeCompare(b, "en"))
      : [];

    const images = files.map((file, index) => {
      const a = assignmentByDest[file] || {};
      const titleEn = a.titleEn || file.replace(IMAGE_EXT, "");
      const titleZh = a.titleZh || titleEn;
      const alt = buildAlt(titleEn, titleZh, destConfig.tour, destConfig.tourZh);
      const caption = titleEn;
      const rel = `${destConfig.libraryRoot}/${category.id}/${file}`;
      return {
        file,
        path: rel,
        url: encodeURI(rel),
        category: category.id,
        categorySlug: category.slug,
        order: index + 1,
        isPrimary: index === 0,
        titleEn,
        titleZh,
        alt,
        caption,
        seoKeywords: [...new Set([...category.keywords, titleEn, titleZh, destConfig.tour, destConfig.tourZh])]
      };
    });

    return {
      ...category,
      imageCount: images.length,
      images,
      primary: images[0] || null
    };
  });

  const allImages = categories.flatMap((c) =>
    c.images.map((img) => ({ ...img, categoryId: c.id }))
  );

  const heroFiles = heroCandidates.map((h) => h.dest);
  const heroImages = heroFiles
    .map((file, index) => {
      const img = allImages.find((i) => i.file === file);
      return img ? { ...img, isPrimary: index === 0 } : null;
    })
    .filter(Boolean);

  const heroPrimary = heroImages[0]
    ? { ...heroImages[0], isPrimary: true }
    : categories.find((c) => c.id === "01-Hero")?.primary || allImages[0] || null;

  return {
    generatedAt: new Date().toISOString(),
    version: "v1-curated",
    tour: destConfig.tour,
    tourZh: destConfig.tourZh,
    libraryRoot: destConfig.libraryRoot,
    totalImages: allImages.length,
    heroPrimary,
    heroImages,
    heroCandidates: heroCandidates.map((h) => ({
      file: h.dest,
      reason: h.reason,
      ...(allImages.find((img) => img.file === h.dest) || {})
    })),
    categories,
    images: allImages
  };
}

function writePhotoIndex(destConfig, assignments, libraryRoot) {
  const header = "original_filename,new_filename,category,titleEn,titleZh\n";
  const rows = assignments.map((a) => {
    const esc = (s) => `"${String(s).replace(/"/g, '""')}"`;
    return [a.source, `${a.category}/${a.dest}`, a.category, a.titleEn, a.titleZh].map(esc).join(",");
  });
  const csv = header + rows.join("\n") + "\n";
  const libraryCsv = path.join(libraryRoot, "photo_index.csv");
  const reportCsv = path.join(ROOT, `reports/2026-06-11-${destConfig.key}-day-tour-index.csv`);
  ensureDir(path.dirname(reportCsv));
  fs.writeFileSync(libraryCsv, csv);
  fs.writeFileSync(reportCsv, csv);
  return { libraryCsv, reportCsv };
}

function main() {
  const data = JSON.parse(fs.readFileSync(ASSIGNMENTS_PATH, "utf8"));

  for (const destKey of ["queenstown", "milford"]) {
    const destConfig = DESTINATIONS[destKey];
    const block = data[destKey];
    const sourceRoot = data.sources[destKey];

    console.log(`\n=== ${destConfig.tour} ===`);
    if (!fs.existsSync(sourceRoot)) {
      console.error(`Source folder missing: ${sourceRoot}`);
      process.exitCode = 1;
      continue;
    }

    const { copied, missing, libraryRoot } = seedDestination(
      destConfig,
      sourceRoot,
      block.assignments,
      block.hero_candidates
    );

    const manifest = buildManifest(destConfig, block.assignments, block.hero_candidates, libraryRoot);
    ensureDir(path.dirname(destConfig.outJson));
    fs.writeFileSync(destConfig.outJson, JSON.stringify(manifest, null, 2) + "\n");
    const { libraryCsv, reportCsv } = writePhotoIndex(destConfig, block.assignments, libraryRoot);

    console.log(`\nWrote ${destConfig.outJson}`);
    console.log(`Wrote ${libraryCsv}`);
    console.log(`Wrote ${reportCsv}`);
    console.log(`Copied/kept: ${copied}, missing sources: ${missing}`);
    console.log(`Total: ${manifest.totalImages} images`);
    console.log(`Hero primary: ${manifest.heroPrimary?.file || "(none)"}`);
    console.log(`Hero candidates: ${manifest.heroImages.map((h) => h.file).join(", ")}`);
    for (const c of manifest.categories) {
      console.log(`  ${c.id}: ${c.imageCount}`);
    }
  }
}

main();
