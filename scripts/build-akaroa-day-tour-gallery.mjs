#!/usr/bin/env node
/**
 * Scan Photo Library/Akaroa-Day-Tour/ and build gallery/akaroa-day-tour.json
 * with auto-generated titles, alt text, and SEO keywords.
 *
 * Run: node scripts/build-akaroa-day-tour-gallery.mjs
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const LIBRARY_ROOT = path.join(ROOT, "Photo Library/Akaroa-Day-Tour");
const OUT_JSON = path.join(ROOT, "gallery/akaroa-day-tour.json");
const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;
const LIBRARY_REL = "Photo Library/Akaroa-Day-Tour";

const CATEGORIES = [
  {
    id: "01-Hero",
    slug: "hero",
    titleZh: "封面主图",
    titleEn: "Hero Banner",
    sectionZh: "阿卡罗阿一日游",
    sectionEn: "Akaroa Day Tour",
    keywords: ["Akaroa day tour", "Banks Peninsula tour", "阿卡罗阿一日游", "班克斯半岛"]
  },
  {
    id: "02-Alpaca-Farm",
    slug: "alpaca-farm",
    titleZh: "羊驼牧场",
    titleEn: "Alpaca Farm",
    sectionZh: "羊驼牧场体验",
    sectionEn: "Alpaca Farm Experience",
    keywords: ["Akaroa alpaca farm", "feed alpacas", "阿卡罗阿羊驼", "羊驼牧场"]
  },
  {
    id: "03-Lobster-Cruise",
    slug: "lobster-cruise",
    titleZh: "龙虾捕捞",
    titleEn: "Lobster Cruise",
    sectionZh: "龙虾捕捞与海湾巡游",
    sectionEn: "Lobster Fishing & Harbour Cruise",
    keywords: ["Akaroa lobster cruise", "crayfish fishing", "阿卡罗阿龙虾", "捕龙虾体验"]
  },
  {
    id: "04-Wildlife",
    slug: "wildlife",
    titleZh: "野生动物",
    titleEn: "Wildlife",
    sectionZh: "野生动物观赏",
    sectionEn: "Wildlife Encounters",
    keywords: ["Akaroa wildlife", "Hector dolphin", "小蓝企鹅", "海鸟"]
  },
  {
    id: "05-Township",
    slug: "township",
    titleZh: "阿卡罗阿小镇",
    titleEn: "Akaroa Township",
    sectionZh: "法式小镇漫步",
    sectionEn: "French Village Stroll",
    keywords: ["Akaroa French village", "Banks Peninsula town", "阿卡罗阿小镇", "法式风情"]
  },
  {
    id: "06-Farm-Factory",
    slug: "farm-factory",
    titleZh: "农场工厂",
    titleEn: "Farm & Factory",
    sectionZh: "农场与工坊参观",
    sectionEn: "Farm & Factory Visit",
    keywords: ["Akaroa cheese factory", "local farm tour", "阿卡罗阿农场", "工坊参观"]
  },
  {
    id: "07-Guest-Experience",
    slug: "guest-experience",
    titleZh: "客人体验",
    titleEn: "Guest Experience",
    sectionZh: "真实客人体验",
    sectionEn: "Real Guest Moments",
    keywords: ["Akaroa tour review", "small group tour", "精品小团", "客人体验"]
  },
  {
    id: "08-Coastal-Scenery",
    slug: "coastal-scenery",
    titleZh: "海岸风光",
    titleEn: "Coastal Scenery",
    sectionZh: "阿卡罗阿海岸风光",
    sectionEn: "Akaroa Coastal Views",
    keywords: ["Akaroa harbour view", "Banks Peninsula coast", "阿卡罗阿海湾", "海岸风光"]
  }
];

/** Seed library from images/akaroa when category folders are empty. */
const SEED_ASSIGNMENTS = {
  "akaroa-harbour-morning-mist-01.jpg": "01-Hero",
  "akaroa-alpaca-farm-landscape-01.jpg": "01-Hero",
  "akaroa-lobster-fishing-rainbow-catch-01.jpg": "01-Hero",
  "akaroa-alpaca-farm-feeding-alpaca-female-01.jpg": "02-Alpaca-Farm",
  "akaroa-alpaca-farm-lake-view-visitor-01.jpg": "02-Alpaca-Farm",
  "akaroa-alpaca-farm-feeding-white-alpaca-01.jpg": "02-Alpaca-Farm",
  "akaroa-alpaca-closeup-portrait-01.jpg": "02-Alpaca-Farm",
  "akaroa-lobster-cruise-catch-lobster-01.jpg": "03-Lobster-Cruise",
  "akaroa-harbour-cruise-rainbow-lobster-01.jpg": "03-Lobster-Cruise",
  "akaroa-harbour-cruise-lobster-display-01.jpg": "03-Lobster-Cruise",
  "akaroa-lobster-catch-box-01.jpg": "03-Lobster-Cruise",
  "akaroa-fishing-experience-01.jpg": "03-Lobster-Cruise",
  "akaroa-paua-and-lobster-01.jpg": "03-Lobster-Cruise",
  "akaroa-harbour-cruise-boat-02.jpg": "03-Lobster-Cruise",
  "akaroa-cruise-cabin-view-01.jpg": "03-Lobster-Cruise",
  "akaroa-penguin-colony-rocks-01.jpg": "04-Wildlife",
  "akaroa-dolphins-harbour-boat-01.jpg": "04-Wildlife",
  "akaroa-war-memorial-garden-01.jpg": "05-Township",
  "akaroa-harbour-cruise-passengers-01.jpg": "07-Guest-Experience",
  "mercedes-sprinter-akaroa-tour-01.jpg": "07-Guest-Experience",
  "akaroa-fishing-boat-ocean-view-01.jpg": "08-Coastal-Scenery"
};

const WORD_ZH = {
  akaroa: "阿卡罗阿",
  alpaca: "羊驼",
  farm: "牧场",
  feeding: "喂食",
  female: "游客",
  lake: "湖景",
  view: "景观",
  visitor: "游客",
  white: "白色",
  closeup: "特写",
  portrait: "肖像",
  landscape: "全景",
  lobster: "龙虾",
  cruise: "巡游",
  catch: "收获",
  harbour: "港湾",
  rainbow: "彩虹",
  display: "展示",
  box: "收获箱",
  fishing: "海钓",
  boat: "游船",
  ocean: "海景",
  experience: "体验",
  paua: "鲍鱼",
  and: "与",
  penguin: "企鹅",
  colony: "群落",
  rocks: "岩石",
  dolphins: "海豚",
  war: "战争",
  memorial: "纪念碑",
  garden: "花园",
  passengers: "游客",
  mercedes: "奔驰",
  sprinter: "Sprinter",
  tour: "一日游",
  cabin: "船舱"
};

const TITLE_OVERRIDES = {
  "akaroa-harbour-morning-mist-01.jpg": {
    titleZh: "晨雾中的阿卡罗阿港湾",
    titleEn: "Akaroa Harbour Morning Mist"
  },
  "akaroa-alpaca-farm-landscape-01.jpg": {
    titleZh: "羊驼牧场海湾全景",
    titleEn: "Alpaca Farm Harbour Panorama"
  },
  "akaroa-lobster-fishing-rainbow-catch-01.jpg": {
    titleZh: "彩虹下的龙虾收获",
    titleEn: "Lobster Catch Under Rainbow"
  },
  "akaroa-alpaca-farm-feeding-alpaca-female-01.jpg": {
    titleZh: "游客喂羊驼",
    titleEn: "Feeding Alpacas at the Farm"
  },
  "akaroa-alpaca-farm-lake-view-visitor-01.jpg": {
    titleZh: "湖景喂羊驼",
    titleEn: "Alpaca Feeding with Harbour View"
  },
  "akaroa-alpaca-farm-feeding-white-alpaca-01.jpg": {
    titleZh: "喂食白色羊驼",
    titleEn: "Feeding a White Alpaca"
  },
  "akaroa-alpaca-closeup-portrait-01.jpg": {
    titleZh: "羊驼正面特写",
    titleEn: "Alpaca Close-Up Portrait"
  },
  "akaroa-lobster-cruise-catch-lobster-01.jpg": {
    titleZh: "游客展示龙虾",
    titleEn: "Guest Showing Fresh Lobster"
  },
  "akaroa-harbour-cruise-rainbow-lobster-01.jpg": {
    titleZh: "彩虹与龙虾",
    titleEn: "Rainbow and Lobster on Deck"
  },
  "akaroa-harbour-cruise-lobster-display-01.jpg": {
    titleZh: "船上龙虾展示",
    titleEn: "Lobster Display on Cruise Boat"
  },
  "akaroa-lobster-catch-box-01.jpg": {
    titleZh: "龙虾收获箱特写",
    titleEn: "Lobster Catch Crate Close-Up"
  },
  "akaroa-fishing-experience-01.jpg": {
    titleZh: "游客海钓体验",
    titleEn: "Sea Fishing Experience"
  },
  "akaroa-paua-and-lobster-01.jpg": {
    titleZh: "鲍鱼与龙虾",
    titleEn: "Pāua and Lobster Fresh Catch"
  },
  "akaroa-harbour-cruise-boat-02.jpg": {
    titleZh: "巡游船停靠码头",
    titleEn: "Wildlife Cruise Boat at Pier"
  },
  "akaroa-cruise-cabin-view-01.jpg": {
    titleZh: "船舱内部体验",
    titleEn: "Inside the Cruise Cabin"
  },
  "akaroa-penguin-colony-rocks-01.jpg": {
    titleZh: "岩石海鸟群落",
    titleEn: "Seabird Colony on Coastal Rocks"
  },
  "akaroa-dolphins-harbour-boat-01.jpg": {
    titleZh: "野生动物巡游船",
    titleEn: "Wildlife Adventures Tour Boat"
  },
  "akaroa-war-memorial-garden-01.jpg": {
    titleZh: "战争纪念碑花园",
    titleEn: "Akaroa War Memorial Garden"
  },
  "akaroa-harbour-cruise-passengers-01.jpg": {
    titleZh: "游客在甲板观景",
    titleEn: "Guests Enjoying Harbour Cruise"
  },
  "mercedes-sprinter-akaroa-tour-01.jpg": {
    titleZh: "奔驰商务车接送",
    titleEn: "Mercedes Sprinter Tour Transfer"
  },
  "akaroa-fishing-boat-ocean-view-01.jpg": {
    titleZh: "海钓海景",
    titleEn: "Ocean View from Fishing Boat"
  }
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function seedLibrary() {
  const sourceRoot = path.join(ROOT, "images/akaroa");
  if (!fs.existsSync(sourceRoot)) return;

  for (const [file, categoryId] of Object.entries(SEED_ASSIGNMENTS)) {
    const destDir = path.join(LIBRARY_ROOT, categoryId);
    const dest = path.join(destDir, file);
    if (fs.existsSync(dest)) continue;

    let source = null;
    for (const sub of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
      if (!sub.isDirectory()) continue;
      const candidate = path.join(sourceRoot, sub.name, file);
      if (fs.existsSync(candidate)) {
        source = candidate;
        break;
      }
    }
    if (!source) {
      console.warn(`[seed] missing source for ${file}`);
      continue;
    }
    ensureDir(destDir);
    fs.copyFileSync(source, dest);
    console.log(`[seed] ${categoryId}/${file}`);
  }
}

function titleFromFilename(file) {
  if (TITLE_OVERRIDES[file]) return TITLE_OVERRIDES[file];
  const stem = file.replace(IMAGE_EXT, "").replace(/-\d+$/, "");
  const parts = stem.split("-").filter((p) => !/^\d+$/.test(p));
  const en = parts
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  const zhParts = parts.map((w) => WORD_ZH[w] || w).filter(Boolean);
  return { titleEn: en, titleZh: zhParts.join("") || en };
}

function buildMeta(file, category) {
  const titles = titleFromFilename(file);
  const alt = `${titles.titleEn} — Akaroa Day Tour, Banks Peninsula, New Zealand | ${titles.titleZh} · 阿卡罗阿一日游`;
  const seoKeywords = [
    ...new Set([
      ...category.keywords,
      titles.titleEn,
      titles.titleZh,
      "Akaroa",
      "阿卡罗阿",
      "Christchurch day tour",
      "基督城周边一日游",
      "Peter South Island tour"
    ])
  ];
  return { ...titles, alt, seoKeywords };
}

const CATEGORY_FILE_ORDER = {
  "01-Hero": [
    "akaroa-harbour-morning-mist-01.jpg",
    "akaroa-alpaca-farm-landscape-01.jpg",
    "akaroa-lobster-fishing-rainbow-catch-01.jpg"
  ]
};

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

function main() {
  ensureDir(LIBRARY_ROOT);
  for (const cat of CATEGORIES) {
    ensureDir(path.join(LIBRARY_ROOT, cat.id));
  }

  seedLibrary();

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

  const heroPrimary = categories.find((c) => c.id === "01-Hero")?.primary || null;

  const manifest = {
    generatedAt: new Date().toISOString(),
    tour: "Akaroa Day Tour",
    tourZh: "阿卡罗阿一日游",
    libraryRoot: LIBRARY_REL,
    totalImages: allImages.length,
    heroPrimary,
    categories,
    images: allImages
  };

  ensureDir(path.dirname(OUT_JSON));
  fs.writeFileSync(OUT_JSON, JSON.stringify(manifest, null, 2) + "\n");

  console.log(`\nWrote ${OUT_JSON}`);
  console.log(`Total: ${allImages.length} images across ${categories.length} categories`);
  for (const c of categories) {
    console.log(`  ${c.id}: ${c.imageCount}`);
  }
}

main();
