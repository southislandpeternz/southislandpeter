#!/usr/bin/env node
/**
 * Build professional photography showcase from Desktop Website-Photos.
 * Landscape-only — no Peter portraits or guest selfies.
 * Run: node scripts/build-photography-showcase.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const DESKTOP = "/Users/yueshe/Desktop/NZ-Travel-photos ";
const WEBSITE_PHOTOS = path.join(DESKTOP, "Website-Photos");
const WEBSITE_LIBRARY = path.join(DESKTOP, "Website-Library");
const WEB_OPTIMIZED = path.join(DESKTOP, "Web-Optimized");
const WEB_ROOT = path.join(ROOT, "images/网页使用照片集");
const SITE_ROOT = path.join(WEB_ROOT, "site");
const OUT_DIR = path.join(WEB_ROOT, "photography-showcase");
const MANIFEST_PATH = path.join(ROOT, "gallery/photography-showcase.json");
const SCORE_PY = path.join(ROOT, "scripts/xhs-showcase-score.py");
const PYTHON = path.join(ROOT, ".venv-photo-organizer/bin/python");
const IMAGE_EXT = /\.(jpe?g|png|webp|heic|gif|avif)$/i;

const EXCLUDE_FOLDER_RE =
  /unknown-location|christchurch|mercedes|penguin|alpaca|unknown/i;
const PERSON_FILE_RE =
  /peter|portrait|selfie|guest|合影|人物|导游|mercedes|vehicle|van|arch|拱门|street|cityscape|urban/i;

const HERO_PRIORITY = [
  {
    key: "mount-cook",
    label: "库克山",
    labelEn: "Mount Cook",
    folders: ["Mount-Cook"],
    category: "mount-cook",
    minAspect: 1.35
  },
  {
    key: "stars",
    label: "特卡波星空",
    labelEn: "Lake Tekapo Stars",
    folders: ["Stargazing"],
    extraFiles: [path.join(SITE_ROOT, "tekapo-stargazing.JPG")],
    category: "tekapo-stars",
    minAspect: 1.3
  },
  {
    key: "milford",
    label: "米尔福德峡湾",
    labelEn: "Milford Sound",
    folders: ["Milford-Sound"],
    category: "milford-sound",
    minAspect: 1.35
  },
  {
    key: "lakes",
    label: "特卡波湖",
    labelEn: "Lake Tekapo",
    folders: ["Lake-Tekapo", "Wanaka", "Queenstown"],
    category: "lake-tekapo",
    minAspect: 1.35
  },
  {
    key: "coastal",
    label: "凯库拉海岸",
    labelEn: "Kaikoura Coast",
    folders: ["Kaikoura", "West-Coast"],
    libraryFolders: ["Whale-Watching"],
    category: "kaikoura",
    minAspect: 1.35
  }
];

/** Landscape-only themes — no guest / Mercedes / portraits */
const THEMES = [
  {
    id: "stars",
    titleZh: "星空",
    titleEn: "Dark Sky",
    folders: ["Stargazing"],
    extraFiles: [path.join(SITE_ROOT, "tekapo-stargazing.JPG")],
    category: "tekapo-stars",
    count: 3
  },
  {
    id: "mountains",
    titleZh: "雪山",
    titleEn: "Alpine Peaks",
    folders: ["Mount-Cook", "Castle-Hill"],
    category: "mount-cook",
    count: 6
  },
  {
    id: "lakes",
    titleZh: "湖泊",
    titleEn: "Turquoise Lakes",
    folders: ["Lake-Tekapo", "Queenstown", "Wanaka"],
    category: "lake-tekapo",
    count: 6
  },
  {
    id: "fjord",
    titleZh: "峡湾",
    titleEn: "Milford Sound",
    folders: ["Milford-Sound"],
    category: "milford-sound",
    count: 4
  },
  {
    id: "coastal",
    titleZh: "海岸线",
    titleEn: "Coast & Ocean",
    folders: ["Kaikoura", "West-Coast"],
    libraryFolders: ["Whale-Watching"],
    category: "kaikoura",
    count: 4
  },
  {
    id: "akaroa",
    titleZh: "阿卡罗阿",
    titleEn: "Akaroa Harbour",
    folders: ["Akaroa"],
    category: "akaroa",
    count: 3
  }
];

const FEATURED_COUNT = 12;
const FEATURED_ORDER = ["stars", "mountains", "lakes", "fjord", "coastal", "akaroa"];
const MIN_LANDSCAPE_ASPECT = 1.15;

function hasSips() {
  try {
    execSync("which sips", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function imageSize(file) {
  if (!hasSips()) return { w: 1600, h: 900, aspect: 16 / 9 };
  const out = execSync(`sips -g pixelWidth -g pixelHeight "${file}"`, { encoding: "utf8" });
  const w = Number(out.match(/pixelWidth:\s*(\d+)/)?.[1] || 1600);
  const h = Number(out.match(/pixelHeight:\s*(\d+)/)?.[1] || 900);
  return { w, h, aspect: w / Math.max(h, 1) };
}

function filterLandscapeFiles(files) {
  return files.filter((f) => {
    const name = path.basename(f).toLowerCase();
    const full = f.toLowerCase();
    if (PERSON_FILE_RE.test(name)) return false;
    if (EXCLUDE_FOLDER_RE.test(full)) return false;
    const { aspect } = imageSize(f);
    if (aspect < MIN_LANDSCAPE_ASPECT) return false;
    return true;
  });
}

function listPhotos(dirs, extraFiles = []) {
  const files = [];
  for (const dir of dirs) {
    if (!dir || !fs.existsSync(dir)) continue;
    const walk = (current) => {
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        if (entry.name.startsWith(".")) continue;
        const full = path.join(current, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (IMAGE_EXT.test(entry.name)) files.push(full);
      }
    };
    walk(dir);
  }
  for (const file of extraFiles || []) {
    if (file && fs.existsSync(file)) files.push(file);
  }
  return filterLandscapeFiles([...new Set(files)]);
}

function resolveSources(folders, extraFiles = [], libraryFolders = []) {
  const dirs = [];
  for (const folder of folders || []) {
    for (const root of [WEBSITE_PHOTOS, WEBSITE_LIBRARY, WEB_OPTIMIZED]) {
      const p = path.join(root, folder);
      if (fs.existsSync(p)) dirs.push(p);
    }
  }
  for (const folder of libraryFolders || []) {
    const p = path.join(WEBSITE_LIBRARY, folder);
    if (fs.existsSync(p)) dirs.push(p);
  }
  return listPhotos(dirs, extraFiles);
}

function rankCandidates(category, files, exclude) {
  if (!files.length) return [];
  const excludeFile = path.join(ROOT, ".tmp-photo-exclude.json");
  fs.writeFileSync(excludeFile, JSON.stringify(exclude));
  try {
    const out = execSync(
      `"${PYTHON}" "${SCORE_PY}" "${category}" "${excludeFile}" ${files.map((f) => `"${f}"`).join(" ")}`,
      { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }
    );
    const rows = JSON.parse(out.trim());
    if (rows.error) throw new Error(rows.error);
    return rows.map((row) => {
      const size = imageSize(row.path);
      row.aspect = size.aspect;
      return row;
    }).filter((row) => row.aspect >= MIN_LANDSCAPE_ASPECT);
  } finally {
    fs.unlinkSync(excludeFile);
  }
}

function optimize(src, dest, maxSize) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (hasSips() && IMAGE_EXT.test(src)) {
    execSync(`sips -Z ${maxSize} -s format jpeg -s formatOptions 85 "${src}" --out "${dest}"`, {
      stdio: "ignore"
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function trackExclude(exclude, row) {
  exclude.md5.push(row.md5);
  exclude.dhash.push(row.dhash);
  if (row.person_dhash) exclude.person_dhash.push(row.person_dhash);
}

function altFromPath(src, label) {
  const base = path.basename(src, path.extname(src)).replace(/[-_]+/g, " ");
  return `新西兰南岛 · ${label} · ${base}`;
}

function exportImage(row, relPath, maxSize, thumbSize) {
  const fullPath = path.join(OUT_DIR, relPath);
  const thumbPath = path.join(OUT_DIR, "thumbs", relPath);
  optimize(row.path, fullPath, maxSize);
  optimize(row.path, thumbPath, thumbSize);
  return {
    full: `images/网页使用照片集/photography-showcase/${relPath.replace(/\\/g, "/")}`,
    thumbUrl: `images/网页使用照片集/photography-showcase/thumbs/${relPath.replace(/\\/g, "/")}`,
    alt: row.alt,
    score: row.score,
    aspect: row.aspect,
    source: path.basename(row.path)
  };
}

function pickHero(exclude) {
  for (const spec of HERO_PRIORITY) {
    const files = resolveSources(spec.folders, spec.extraFiles, spec.libraryFolders);
    const ranked = rankCandidates(spec.category, files, exclude);
    const landscape = ranked
      .filter((row) => row.aspect >= (spec.minAspect || 1.35))
      .sort((a, b) => b.aspect * (b.score || 0) - a.aspect * (a.score || 0));
    const wide = landscape.filter((row) => row.aspect >= 1.5);
    const pick = wide[0] || landscape[0] || ranked[0];
    if (!pick) continue;
    pick.alt = altFromPath(pick.path, spec.label);
    pick.label = spec.label;
    pick.labelEn = spec.labelEn;
    pick.theme = spec.key;
    trackExclude(exclude, pick);
    return pick;
  }
  return null;
}

function pickThemeImages(theme, exclude) {
  const files = resolveSources(theme.folders, theme.extraFiles, theme.libraryFolders);
  let ranked = rankCandidates(theme.category, files, exclude);
  if (!ranked.length && theme.extraFiles?.length) {
    ranked = theme.extraFiles
      .filter((f) => f && fs.existsSync(f))
      .map((f) => {
        const size = imageSize(f);
        return { path: f, score: 1000, aspect: size.aspect, md5: f, dhash: f, person_dhash: f };
      })
      .filter((row) => row.aspect >= MIN_LANDSCAPE_ASPECT);
  }
  const picked = [];
  for (const row of ranked) {
    if (picked.length >= theme.count) break;
    row.alt = altFromPath(row.path, theme.titleZh);
    trackExclude(exclude, row);
    picked.push(row);
  }
  return picked;
}

function buildFeatured(allThemeRows, heroRow) {
  const buckets = {};
  for (const row of allThemeRows) {
    if (row.md5 === heroRow.md5) continue;
    if (row.aspect < MIN_LANDSCAPE_ASPECT) continue;
    (buckets[row.themeId] ||= []).push(row);
  }
  for (const id of Object.keys(buckets)) {
    buckets[id].sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const out = [];
  let guard = 0;
  while (out.length < FEATURED_COUNT && guard++ < 80) {
    let added = false;
    for (const themeId of FEATURED_ORDER) {
      const bucket = buckets[themeId];
      if (!bucket?.length) continue;
      const row = bucket.shift();
      if (out.some((r) => r.md5 === row.md5)) continue;
      out.push(row);
      added = true;
      if (out.length >= FEATURED_COUNT) break;
    }
    if (!added) {
      for (const themeId of FEATURED_ORDER) {
        const bucket = buckets[themeId];
        if (!bucket?.length) continue;
        out.push(bucket.shift());
        if (out.length >= FEATURED_COUNT) break;
      }
      if (!out.length || out.length >= FEATURED_COUNT) break;
    }
  }
  return out.slice(0, FEATURED_COUNT);
}

function clearOutDir() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
    return;
  }
  for (const entry of fs.readdirSync(OUT_DIR)) {
    const full = path.join(OUT_DIR, entry);
    if (entry === "thumbs") {
      if (fs.existsSync(full)) {
        for (const f of fs.readdirSync(full)) {
          fs.rmSync(path.join(full, f), { force: true, recursive: true });
        }
      }
    } else {
      fs.rmSync(full, { force: true, recursive: true });
    }
  }
}

function main() {
  if (!fs.existsSync(WEBSITE_PHOTOS)) {
    console.error("Website-Photos not found:", WEBSITE_PHOTOS);
    process.exit(1);
  }

  clearOutDir();
  const exclude = { md5: [], dhash: [], person_dhash: [] };

  const heroRow = pickHero(exclude);
  if (!heroRow) {
    console.error("No hero image found.");
    process.exit(1);
  }

  const hero = exportImage(heroRow, "hero.jpg", 2400, 1200);
  hero.label = heroRow.label;
  hero.labelEn = heroRow.labelEn;
  hero.theme = heroRow.theme;

  const themes = [];
  const allThemeRows = [];

  for (const theme of THEMES) {
    const rows = pickThemeImages(theme, exclude);
    const images = rows.map((row, idx) =>
      exportImage(row, `themes/${theme.id}/${theme.id}-${String(idx + 1).padStart(2, "0")}.jpg`, 1920, 720)
    );
    if (images.length) {
      themes.push({
        id: theme.id,
        titleZh: theme.titleZh,
        titleEn: theme.titleEn,
        images
      });
    }
    allThemeRows.push(...rows.map((row) => ({ ...row, themeId: theme.id })));
  }

  const featuredRows = buildFeatured(allThemeRows, heroRow);
  const featured = featuredRows.map((row, idx) => {
    const img = exportImage(row, `featured/featured-${String(idx + 1).padStart(2, "0")}.jpg`, 1920, 800);
    img.theme = row.themeId;
    return img;
  });

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: WEBSITE_PHOTOS,
    filters: ["landscape_only", "no_portraits", "no_peter", "theme_interleave"],
    hero,
    featured,
    themes,
    counts: {
      featured: featured.length,
      themes: themes.reduce((n, t) => n + t.images.length, 0)
    }
  };

  fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Hero: ${hero.label} (${hero.source})`);
  console.log(`Featured: ${featured.length} · Themes: ${manifest.counts.themes}`);
  console.log(`Manifest: ${MANIFEST_PATH}`);
}

main();
