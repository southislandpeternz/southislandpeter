#!/usr/bin/env node
/**
 * Scan Photo Library/Kaikoura-Day-Tour/ and build gallery/kaikoura-day-tour.json
 * Kaikoura Day Tour v1 — 6 categories, SEO titles/alt/keywords.
 *
 * Run: node scripts/build-kaikoura-day-tour-gallery.mjs
 * Scan disk only (no MASTER re-seed): node scripts/build-kaikoura-day-tour-gallery.mjs --from-disk
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const LIBRARY_ROOT = path.join(ROOT, "Photo Library/Kaikoura-Day-Tour");
const MASTER_ROOT = path.join(ROOT, "Photos/Kaikoura_MASTER/Organized");
const MASTER_ORIGINALS = path.join(ROOT, "Photos/Kaikoura_MASTER/_originals/desktop-kaikoura");
const OUT_JSON = path.join(ROOT, "gallery/kaikoura-day-tour.json");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;
const LIBRARY_REL = "Photo Library/Kaikoura-Day-Tour";
const FORCE = process.argv.includes("--force");
const FROM_DISK = process.argv.includes("--from-disk");

function masterPath(...parts) {
  return path.join(MASTER_ROOT, ...parts);
}

const CATEGORIES = [
  {
    id: "01-Coastal-Scenery",
    slug: "coastal-scenery",
    titleZh: "海岸风光",
    titleEn: "Coastal Scenery",
    sectionZh: "凯库拉海岸风光",
    sectionEn: "Kaikoura Coastal Scenery",
    keywords: ["Kaikoura coastal scenery", "seals and mountains", "凯库拉海岸", "雪山海岸"]
  },
  {
    id: "02-Whale-Watching",
    slug: "whale-watching",
    titleZh: "观鲸系列",
    titleEn: "Whale Watching",
    sectionZh: "观鲸体验",
    sectionEn: "Whale Watching Experience",
    keywords: ["Kaikoura whale watching", "aerial sperm whale", "凯库拉观鲸", "航拍鲸鱼"]
  },
  {
    id: "03-Fishing-Experience",
    slug: "fishing-experience",
    titleZh: "海钓体验",
    titleEn: "Fishing Experience",
    sectionZh: "Rod Father 海钓",
    sectionEn: "Rod Father Fishing Charter",
    keywords: ["Rod Father Kaikoura", "deep sea fishing", "凯库拉海钓", "钓鱼船"]
  },
  {
    id: "04-Seafood-BBQ",
    slug: "seafood-bbq",
    titleZh: "海鲜大餐",
    titleEn: "Seafood BBQ",
    sectionZh: "凯库拉海鲜 BBQ",
    sectionEn: "Kaikoura Seafood BBQ",
    keywords: ["Kaikoura crayfish", "lobster lunch", "凯库拉龙虾", "海鲜 BBQ"]
  },
  {
    id: "05-Guest-Experience",
    slug: "guest-experience",
    titleZh: "客人体验",
    titleEn: "Guest Experience",
    sectionZh: "真实客人体验",
    sectionEn: "Real Guest Moments",
    keywords: ["Kaikoura tour guests", "travel experience", "凯库拉客人体验", "精品小团"]
  },
  {
    id: "06-Wildlife",
    slug: "wildlife",
    titleZh: "野生动物",
    titleEn: "Wildlife",
    sectionZh: "海豹与野生动物",
    sectionEn: "Seals & Wildlife",
    keywords: ["Kaikoura fur seal", "seal colony", "凯库拉海豹", "野生动物"]
  }
];

/** Curated assignments: filename → { category, source (relative to ROOT or absolute) } */
const V1_ASSIGNMENTS = {
  "kaikoura-coastal-seals-mountains-01.jpg": {
    category: "01-Coastal-Scenery",
    source: masterPath("01-Coastal-Scenery/kaikoura-coastal-seals-mountains-01.jpg")
  },
  "kaikoura-coastal-scenery-coast-01.jpg": {
    category: "01-Coastal-Scenery",
    source: masterPath("01-Coastal-Scenery/kaikkoura-coast16.JPG")
  },
  "kaikoura-coastal-peninsula-landscape-01.jpg": {
    category: "01-Coastal-Scenery",
    source: masterPath("02-Kaikoura-Peninsula/kaikkoura-peninsula140.jpg")
  },
  "kaikoura-coastal-scenery-guests-01.jpg": {
    category: "01-Coastal-Scenery",
    source: path.join(MASTER_ORIGINALS, "IMG_7229.JPG")
  },
  "kaikoura-coastal-rod-father-bay-01.jpg": {
    category: "01-Coastal-Scenery",
    source: masterPath("02-Kaikoura-Peninsula/kaikkoura-peninsula120.JPG")
  },
  "whale-watching-sperm-whale-01.jpg": {
    category: "02-Whale-Watching",
    source: masterPath("04-Whale-Watching/kaikoura6.jpg")
  },
  "whale-watching-aerial-01.jpg": {
    category: "02-Whale-Watching",
    source: masterPath("04-Whale-Watching/whale-watching-aerial-01.jpg")
  },
  "fishing-boat-docked-01.jpg": {
    category: "03-Fishing-Experience",
    source: masterPath("06-Fishing-Experience/fishing-boat-docked-01.jpg")
  },
  "fishing-prep-boarding-01.jpg": {
    category: "03-Fishing-Experience",
    source: masterPath("01-Coastal-Scenery/kaikkoura-coast15.JPG")
  },
  "fishing-trip-at-sea-01.jpg": {
    category: "03-Fishing-Experience",
    source: masterPath("01-Coastal-Scenery/kaikkoura-coast13.JPG")
  },
  "seafood-bbq-lobster-half-01.jpg": {
    category: "04-Seafood-BBQ",
    source: path.join(MASTER_ORIGINALS, "lake-tekapo112.jpeg")
  },
  "seafood-bbq-lobster-chips-01.jpg": {
    category: "04-Seafood-BBQ",
    source: masterPath("08-Guest-Experience/lake-tekapo13.JPG")
  },
  "seafood-bbq-lobster-closeup-01.jpg": {
    category: "04-Seafood-BBQ",
    source: masterPath("09-Photography-Showcase/lake-tekapo120.JPG")
  },
  "guest-experience-lobster-feast-01.jpg": {
    category: "05-Guest-Experience",
    source: masterPath("08-Guest-Experience/lake-tekapo119.jpeg")
  },
  "guest-experience-dining-02.jpg": {
    category: "05-Guest-Experience",
    source: masterPath("08-Guest-Experience/IMG_2678.JPG")
  },
  "wildlife-fur-seals-peninsula-01.jpg": {
    category: "06-Wildlife",
    source: masterPath("03-Wildlife/wildlife-fur-seals-peninsula-01.jpg")
  },
  "wildlife-fur-seal-coast-01.jpg": {
    category: "06-Wildlife",
    source: masterPath("03-Wildlife/wildlife-fur-seal-coast-01.jpg")
  },
  "wildlife-seal-colony-walk-01.jpg": {
    category: "06-Wildlife",
    source: masterPath("03-Wildlife/wildlife-seal-colony-walk-01.jpg")
  }
};

const TITLE_OVERRIDES = {
  "kaikoura-coastal-seals-mountains-01.jpg": {
    titleZh: "海豹群落与雪山海岸",
    titleEn: "Fur Seals with Mountain Coastline"
  },
  "kaikoura-coastal-scenery-coast-01.jpg": {
    titleZh: "凯库拉东海岸全景",
    titleEn: "Kaikoura East Coast Panorama"
  },
  "kaikoura-coastal-peninsula-landscape-01.jpg": {
    titleZh: "凯库拉半岛步道风光",
    titleEn: "Kaikoura Peninsula Trail Vista"
  },
  "kaikoura-coastal-scenery-guests-01.jpg": {
    titleZh: "蓝绿色海岸线漫步",
    titleEn: "Turquoise Coastline Rock Walk"
  },
  "kaikoura-coastal-rod-father-bay-01.jpg": {
    titleZh: "Rod Father 游艇与海湾",
    titleEn: "Rod Father Charter in Kaikoura Bay"
  },
  "whale-watching-sperm-whale-01.jpg": {
    titleZh: "抹香鲸浮出海面",
    titleEn: "Sperm Whale Surfacing in Kaikoura"
  },
  "whale-watching-aerial-01.jpg": {
    titleZh: "航拍鲸鱼浮上海面",
    titleEn: "Aerial Whale Surfacing in Turquoise Water"
  },
  "fishing-boat-docked-01.jpg": {
    titleZh: "Rod Father 游艇停靠码头",
    titleEn: "Rod Father Fishing Boat at Pier"
  },
  "fishing-prep-boarding-01.jpg": {
    titleZh: "出海前登船准备",
    titleEn: "Boarding Rod Father Before Departure"
  },
  "fishing-trip-at-sea-01.jpg": {
    titleZh: "Rod Father 深海出海",
    titleEn: "Rod Father Deep Sea Fishing Trip"
  },
  "seafood-bbq-lobster-half-01.jpg": {
    titleZh: "半只龙虾套餐",
    titleEn: "Half Crayfish Lunch Plate"
  },
  "seafood-bbq-lobster-chips-01.jpg": {
    titleZh: "龙虾薯条套餐",
    titleEn: "Crayfish and Chips Platter"
  },
  "seafood-bbq-lobster-closeup-01.jpg": {
    titleZh: "龙虾摆盘特写",
    titleEn: "Fresh Crayfish Close-Up"
  },
  "guest-experience-lobster-feast-01.jpg": {
    titleZh: "客人享用凯库拉龙虾",
    titleEn: "Guests Enjoying Kaikoura Crayfish Feast"
  },
  "guest-experience-dining-02.jpg": {
    titleZh: "海鲜午餐真实体验",
    titleEn: "Real Guest Seafood Lunch Moment"
  },
  "wildlife-fur-seals-peninsula-01.jpg": {
    titleZh: "半岛步道海豹群落",
    titleEn: "Fur Seals on Peninsula Walk"
  },
  "wildlife-fur-seal-coast-01.jpg": {
    titleZh: "岩石上的海狗",
    titleEn: "Fur Seal on Coastal Rocks"
  },
  "wildlife-seal-colony-walk-01.jpg": {
    titleZh: "游客观海豹",
    titleEn: "Guests Watching Seal Colony"
  }
};

const CATEGORY_FILE_ORDER = {
  "01-Coastal-Scenery": [
    "kaikoura-coastal-seals-mountains-01.jpg",
    "kaikoura-coastal-scenery-coast-01.jpg",
    "kaikoura-coastal-peninsula-landscape-01.jpg",
    "kaikoura-coastal-scenery-guests-01.jpg",
    "kaikoura-coastal-rod-father-bay-01.jpg"
  ],
  "02-Whale-Watching": [
    "whale-watching-sperm-whale-01.jpg",
    "whale-watching-aerial-01.jpg"
  ],
  "04-Seafood-BBQ": [
    "seafood-bbq-lobster-half-01.jpg",
    "seafood-bbq-lobster-chips-01.jpg",
    "seafood-bbq-lobster-closeup-01.jpg"
  ],
  "05-Guest-Experience": [
    "guest-experience-lobster-feast-01.jpg",
    "guest-experience-dining-02.jpg"
  ],
  "03-Fishing-Experience": [
    "fishing-boat-docked-01.jpg",
    "fishing-prep-boarding-01.jpg",
    "fishing-trip-at-sea-01.jpg"
  ],
  "06-Wildlife": [
    "wildlife-fur-seals-peninsula-01.jpg",
    "wildlife-fur-seal-coast-01.jpg",
    "wildlife-seal-colony-walk-01.jpg"
  ]
};

/** Homepage / banner hero picks (priority order; missing files skipped at build) */
const HERO_PICKS = [
  "kaikoura-coastal-seals-mountains-01.jpg",
  "kaikoura-coastal-peninsula-landscape-01.jpg",
  "kaikoura-coastal-scenery-coast-01.jpg",
  "whale-watching-sperm-whale-01.jpg",
  "whale-watching-aerial-01.jpg"
];

const WORD_ZH = {
  kaikoura: "凯库拉",
  coastal: "海岸",
  scenery: "风光",
  seals: "海豹",
  mountains: "雪山",
  guests: "游客",
  rod: "Rod",
  father: "Father",
  bay: "海湾",
  whale: "鲸鱼",
  watching: "观鲸",
  aerial: "航拍",
  fishing: "海钓",
  boat: "游艇",
  docked: "停靠",
  prep: "准备",
  boarding: "登船",
  trip: "出海",
  sea: "深海",
  seafood: "海鲜",
  bbq: "BBQ",
  lobster: "龙虾",
  half: "半只",
  chips: "薯条",
  closeup: "特写",
  guest: "客人",
  experience: "体验",
  dining: "用餐",
  group: "聚餐",
  lunch: "午餐",
  couple: "情侣",
  wildlife: "野生动物",
  fur: "海狗",
  seal: "海豹",
  colony: "群落",
  peninsula: "半岛",
  walk: "步道"
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

function seedLibrary() {
  for (const cat of CATEGORIES) {
    ensureDir(path.join(LIBRARY_ROOT, cat.id));
  }

  const assigned = new Set(Object.keys(V1_ASSIGNMENTS));

  for (const [file, { category, source }] of Object.entries(V1_ASSIGNMENTS)) {
    const dest = path.join(LIBRARY_ROOT, category, file);
    const src = path.isAbsolute(source) ? source : path.join(ROOT, source);
    if (!fs.existsSync(src)) {
      console.warn(`[seed] missing source for ${file}: ${source}`);
      continue;
    }
    ensureDir(path.dirname(dest));
    if (fs.existsSync(dest) && !FORCE) continue;
    fs.copyFileSync(src, dest);
    optimizeWebImage(dest);
    console.log(`[seed] ${category}/${file}`);
  }

  // Remove files no longer in the curated set
  for (const cat of CATEGORIES) {
    const dir = path.join(LIBRARY_ROOT, cat.id);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!IMAGE_EXT.test(file)) continue;
      const expected = [...assigned].some(
        (f) => V1_ASSIGNMENTS[f].category === cat.id && f === file
      );
      if (!expected) {
        fs.unlinkSync(path.join(dir, file));
        console.log(`[prune] removed ${cat.id}/${file}`);
      }
    }
  }
}

function titleFromFilename(file) {
  if (TITLE_OVERRIDES[file]) return TITLE_OVERRIDES[file];
  const stem = file.replace(IMAGE_EXT, "").replace(/-\d+$/, "");
  const parts = stem.split("-").filter((p) => !/^\d+$/.test(p));
  const en = parts.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  const zhParts = parts.map((w) => WORD_ZH[w] || w).filter(Boolean);
  return { titleEn: en, titleZh: zhParts.join("") || en };
}

function buildMeta(file, category) {
  const titles = titleFromFilename(file);
  const alt = `${titles.titleEn} — Kaikoura Day Tour, Canterbury Coast, New Zealand | ${titles.titleZh} · 凯库拉一日游`;
  const seoKeywords = [
    ...new Set([
      ...category.keywords,
      titles.titleEn,
      titles.titleZh,
      "Kaikoura",
      "凯库拉",
      "Christchurch day tour",
      "基督城周边一日游",
      "Peter South Island tour"
    ])
  ];
  return { ...titles, alt, seoKeywords };
}

function sortFiles(categoryId, files) {
  const order = CATEGORY_FILE_ORDER[categoryId];
  if (!order) return files.sort((a, b) => a.localeCompare(b, "en"));
  return files.sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b, "en");
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function scanCategory(category) {
  const dir = path.join(LIBRARY_ROOT, category.id);
  if (!fs.existsSync(dir)) return [];

  return sortFiles(
    category.id,
    fs.readdirSync(dir).filter((f) => IMAGE_EXT.test(f))
  ).map((file, index) => {
    const rel = `${LIBRARY_REL}/${category.id}/${file}`;
    const meta = buildMeta(file, category);
    return {
      file,
      path: rel,
      url: encodeURI(rel),
      order: index + 1,
      isPrimary: index === 0,
      ...meta
    };
  });
}

function findImageByFile(allImages, file) {
  return allImages.find((img) => img.file === file) || null;
}

function resolveHeroPicks(allImages) {
  const picked = [];
  const seen = new Set();
  for (const file of HERO_PICKS) {
    const img = findImageByFile(allImages, file);
    if (img && !seen.has(file)) {
      picked.push(img);
      seen.add(file);
    }
  }
  if (picked.length >= 3) return picked.slice(0, 3);
  for (const img of allImages) {
    if (seen.has(img.file)) continue;
    picked.push(img);
    seen.add(img.file);
    if (picked.length >= 3) break;
  }
  return picked;
}

function main() {
  ensureDir(LIBRARY_ROOT);
  if (!FROM_DISK) {
    seedLibrary();
  } else {
    console.log("[from-disk] scanning Photo Library only — no MASTER re-seed");
  }

  const categories = CATEGORIES.map((category) => {
    const images = scanCategory(category);
    return {
      ...category,
      imageCount: images.length,
      images,
      primary: images[0] || null
    };
  });

  const allImages = categories.flatMap((c) =>
    c.images.map((img) => ({ ...img, categoryId: c.id, categorySlug: c.slug }))
  );

  const heroImages = resolveHeroPicks(allImages);
  const heroPrimary = heroImages[0] || categories.find((c) => c.id === "01-Coastal-Scenery")?.primary || null;

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: FROM_DISK ? "v2-disk" : "v2-master",
    tour: "Kaikoura Day Tour",
    tourZh: "凯库拉一日游",
    libraryRoot: LIBRARY_REL,
    totalImages: allImages.length,
    heroPrimary,
    heroImages,
    categories,
    images: allImages
  };

  ensureDir(path.dirname(OUT_JSON));
  fs.writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nWrote ${OUT_JSON}`);
  console.log(`Total: ${allImages.length} images across ${categories.length} categories`);
  console.log(`Hero primary: ${heroPrimary?.file || "(none)"}`);
  console.log(`Hero carousel: ${heroImages.map((h) => h.file).join(", ")}`);
  for (const c of categories) {
    console.log(`  ${c.id}: ${c.imageCount}`);
    for (const img of c.images) {
      console.log(`    - ${img.file}`);
    }
  }
}

main();
