#!/usr/bin/env node
/**
 * Scans NZ-Travel-photos/{region}/ and generates gallery manifest + HTML pages.
 * Run: node scripts/generate-gallery.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const PHOTOS_ROOT = path.join(ROOT, "NZ-Travel-photos");
const GALLERY_DIR = path.join(ROOT, "gallery");
const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

const REGION_SLUGS = [
  "akaroa",
  "arrowtown",
  "ashburton",
  "castle-hill",
  "christchurch",
  "dunedin",
  "french-farm",
  "hanmer-springs",
  "kaikoura",
  "lake-tekapo",
  "lake-pukaki",
  "little-river",
  "milford-sound",
  "moeraki-boulders",
  "mount-cook",
  "oamaru",
  "queenstown",
  "rakaia",
  "te-anau",
  "timaru",
  "twizel",
  "wanaka",
  "west-coast"
];

const SEO_TITLES = {
  akaroa: "Akaroa Photography",
  arrowtown: "Arrowtown Photography",
  ashburton: "Ashburton Photography",
  "castle-hill": "Castle Hill Photography",
  christchurch: "Christchurch Travel Photography",
  dunedin: "Dunedin Photography",
  "french-farm": "French Farm Photography",
  "hanmer-springs": "Hanmer Springs Photography",
  kaikoura: "Kaikoura Whale Watching",
  "lake-tekapo": "Lake Tekapo Photography",
  "lake-pukaki": "Lake Pukaki Photography",
  "little-river": "Little River Photography",
  "milford-sound": "Milford Sound Photography",
  "moeraki-boulders": "Moeraki Boulders Photography",
  "mount-cook": "Mount Cook Scenic Photography",
  oamaru: "Oamaru Photography",
  queenstown: "Queenstown Travel Photography",
  rakaia: "Rakaia Photography",
  "te-anau": "Te Anau Photography",
  timaru: "Timaru Photography",
  twizel: "Twizel Photography",
  wanaka: "Wanaka Travel Photography",
  "west-coast": "West Coast Photography"
};

const SEED_IMAGES = {
  kaikoura: ["optimized-images/kajkoura-whale-watch.jpg", "optimized-images/kaikoura6.jpg", "optimized-images/kaikoura10.jpg"],
  "mount-cook": ["optimized-images/mt-cook1.JPG", "optimized-images/hooker-valley-track.JPG", "optimized-images/tasman-glacier-track.JPG"],
  "lake-tekapo": ["optimized-images/tekapo-stargazing.JPG"],
  christchurch: ["optimized-images/christchurch4.jpg", "optimized-images/christchurch2.jpg"],
  queenstown: ["optimized-images/kaikoura10.jpg"],
  wanaka: ["optimized-images/tasman-glacier-track.JPG"],
  "milford-sound": ["optimized-images/hooker-valley-track.JPG"],
  akaroa: ["optimized-images/christchurch3.jpg"],
  "hanmer-springs": ["optimized-images/christchurch1.jpg"],
  oamaru: ["optimized-images/christchurch5.jpg"],
  "west-coast": ["optimized-images/kaikoura3.jpg"]
};

function slugToName(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

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

function listImages(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f) && f !== ".DS_Store")
    .sort((a, b) => a.localeCompare(b, "en"));
}

function seedRegion(slug) {
  const dir = path.join(PHOTOS_ROOT, slug);
  fs.mkdirSync(dir, { recursive: true });
  const existing = listImages(dir);
  if (existing.length > 0) return;
  const seeds = SEED_IMAGES[slug];
  if (!seeds) return;
  seeds.forEach((rel, i) => {
    const src = path.join(ROOT, rel);
    if (!fs.existsSync(src)) return;
    const ext = path.extname(src);
    const dest = path.join(dir, `seed-${i + 1}${ext}`);
    fs.copyFileSync(src, dest);
  });
}

function scanRegion(slug) {
  const dir = path.join(PHOTOS_ROOT, slug);
  seedRegion(slug);
  const files = listImages(dir);
  if (!files.length) return null;

  const name = slugToName(slug);
  const title = SEO_TITLES[slug] || `${name} Photography`;
  const thumbsDir = path.join(dir, "thumbs");
  const images = files.map((file) => {
    const fullPath = path.join(dir, file);
    const thumbPath = path.join(thumbsDir, file);
    makeThumb(fullPath, thumbPath, 720);
    const stat = fs.statSync(fullPath);
    return {
      file,
      thumb: `thumbs/${file}`,
      mtime: stat.mtimeMs
    };
  });

  const cover = images[0];
  const coverThumbPath = path.join(thumbsDir, cover.file);
  makeThumb(path.join(dir, cover.file), coverThumbPath, 960);

  return {
    slug,
    name,
    title,
    description: `${title} — Peter's South Island travel photography gallery.`,
    cover: cover.file,
    coverThumb: cover.thumb,
    imageCount: images.length,
    images
  };
}

function rel(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function headerNav(base) {
  return `      <nav class="nav-center" id="mainNav" aria-label="主导航">
        <a href="${base}index.html">首页</a>
        <a href="${base}index.html#peter">关于 Peter</a>
        <a href="${base}routes.html">精品线路</a>
        <a href="${base}availability.html">档期安排</a>
        <a href="${base}gallery/index.html" aria-current="page">摄影旅拍</a>
        <a href="${base}testimonials.html">客人评价</a>
        <a href="${base}index.html#contact">联系我们</a>
      </nav>`;
}

function pageShell({ base, title, description, bodyClass, main }) {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${description}">
  <title>${title} | Peter · 南岛真实漫旅行</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${base}styles.css">
</head>
<body class="${bodyClass}">
  <header class="site-header" id="siteHeader">
    <div class="header-bar">
      <a href="${base}index.html" class="brand">
        <img src="${base}optimized-images/logo.png" class="site-logo" alt="新西兰天天旅行社 Logo" width="48" height="48" loading="eager">
        <div class="brand-text">
          <div class="brand-en">Tian Tian Travel Ltd</div>
          <div class="brand-zh">新西兰天天旅行社</div>
        </div>
      </a>
${headerNav(base)}
      <div class="header-actions">
        <a href="tel:+6421976868" class="header-phone">
          <span class="phone-label">咨询热线</span>
          <span class="phone-num">+64 21 976 868</span>
        </a>
        <a href="${base}index.html#contact" class="btn-cta">立即咨询</a>
        <button type="button" class="nav-toggle" id="navToggle" aria-label="菜单" aria-expanded="false">
          <span></span><span></span>
        </button>
      </div>
    </div>
  </header>
  <main>
${main}
  </main>
  <footer class="footer">
    <div class="container">
      <p class="footer-copy">
        <a href="${base}gallery/index.html">← 返回摄影相册</a> · <a href="${base}index.html">首页</a> · © 2026 Tian Tian Travel Ltd
      </p>
    </div>
  </footer>
  <div class="lightbox" id="lightbox" hidden role="dialog" aria-modal="true" aria-label="图片预览">
    <button type="button" class="lightbox-close" aria-label="关闭">&times;</button>
    <button type="button" class="lightbox-prev" aria-label="上一张">‹</button>
    <img class="lightbox-img" id="lightboxImg" alt="">
    <button type="button" class="lightbox-next" aria-label="下一张">›</button>
  </div>
  <script src="${base}gallery.js"></script>
  <script src="${base}script.js"></script>
</body>
</html>
`;
}

function writeHub() {
  const base = "../";
  const main = `    <section class="tt-banner">
      <div class="tt-banner-inner">
        <p class="tt-banner-kicker">Photography Gallery</p>
        <h1>南岛摄影相册</h1>
        <p>按地区浏览 Peter 镜头下的新西兰南岛 — 新增照片放入 NZ-Travel-photos 对应文件夹后运行生成脚本即可更新。</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="gallery-region-grid" id="galleryHubGrid" aria-busy="true"></div>
      </div>
    </section>`;

  fs.mkdirSync(GALLERY_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(GALLERY_DIR, "index.html"),
    pageShell({
      base,
      title: "Photography Gallery",
      description: "South Island photography by region — Akaroa, Kaikoura, Mount Cook, Queenstown, Wanaka, Milford Sound and more.",
      bodyClass: "page-tour page-gallery page-gallery-hub",
      main
    })
  );
}

function writeRegionPage(region) {
  const base = "../../";
  const main = `    <section class="tt-banner tt-banner--region">
      <div class="tt-banner-inner">
        <p class="tt-banner-kicker">Photography Gallery</p>
        <h1>${region.name}</h1>
        <p>${region.title}</p>
      </div>
    </section>
    <section class="section">
      <div class="container">
        <div class="home-gallery-masonry tt-masonry gallery-region-masonry reveal" id="regionGalleryMasonry" data-gallery-region="${region.slug}" aria-busy="true"></div>
      </div>
    </section>`;

  const dir = path.join(GALLERY_DIR, region.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, "index.html"),
    pageShell({
      base,
      title: region.title,
      description: region.description,
      bodyClass: "page-tour page-gallery page-gallery-region",
      main
    })
  );
}

fs.mkdirSync(PHOTOS_ROOT, { recursive: true });
REGION_SLUGS.forEach((slug) => fs.mkdirSync(path.join(PHOTOS_ROOT, slug), { recursive: true }));

const regions = REGION_SLUGS.map(scanRegion).filter(Boolean);

const manifest = {
  generatedAt: new Date().toISOString(),
  photosRoot: "NZ-Travel-photos",
  regions: regions.map((r) => ({
    ...r,
    url: `gallery/${r.slug}/`,
    coverUrl: `NZ-Travel-photos/${r.slug}/${r.coverThumb}`,
    images: r.images.map((img) => ({
      ...img,
      full: `NZ-Travel-photos/${r.slug}/${img.file}`,
      thumbUrl: `NZ-Travel-photos/${r.slug}/${img.thumb}`
    }))
  }))
};

fs.mkdirSync(GALLERY_DIR, { recursive: true });
fs.writeFileSync(path.join(GALLERY_DIR, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");

writeHub();
REGION_SLUGS.forEach((slug) => {
  const region = regions.find((r) => r.slug === slug) || {
    slug,
    name: slugToName(slug),
    title: SEO_TITLES[slug] || `${slugToName(slug)} Photography`,
    description: `${SEO_TITLES[slug] || slugToName(slug)} — Peter's South Island travel photography gallery.`
  };
  writeRegionPage(region);
});

// Root gallery.html redirect
fs.writeFileSync(
  path.join(ROOT, "gallery.html"),
  `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=gallery/index.html">
  <link rel="canonical" href="gallery/index.html">
  <title>Redirecting to Photography Gallery</title>
  <script>location.replace("gallery/index.html");</script>
</head>
<body>
  <p><a href="gallery/index.html">进入摄影相册</a></p>
</body>
</html>
`
);

console.log(`Gallery: ${regions.length} regions, ${regions.reduce((n, r) => n + r.imageCount, 0)} photos`);
