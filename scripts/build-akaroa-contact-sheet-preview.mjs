#!/usr/bin/env node
/**
 * Build local-only Akaroa cover contact sheet preview under _previews/ (gitignored).
 * Copies photos as real files — never symlinks — so previews are safe if accidentally committed.
 *
 * Run: node scripts/build-akaroa-contact-sheet-preview.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "_previews/akaroa-contact-sheet-preview");
const PHOTOS_DIR = path.join(OUT_DIR, "photos");
const THUMBS_DIR = path.join(OUT_DIR, "thumbs");
const DESKTOP_AKAROA = path.join(
  process.env.HOME || "",
  "Desktop/NZ-Travel-photos /akaroa"
);

const PHOTOS = [
  "IMG_7422.JPG",
  "IMG_7454.JPG",
  "IMG_7113.jpeg",
  "IMG_6399.jpeg",
  "IMG_6486.jpeg",
];

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

function thumbName(photo) {
  const base = path.parse(photo).name;
  return `${base}-thumb.jpg`;
}

function makeThumb(src, dest) {
  execSync(
    `sips -Z 640 "${src}" --out "${dest}" --setProperty format jpeg --setProperty formatOptions 80`,
    { stdio: "pipe" }
  );
}

function buildHtml() {
  const cells = PHOTOS.map((name) => {
    const thumb = thumbName(name);
    return `      <div class="cell">
        <button type="button" data-full="photos/${name}" data-name="${name}">
          <img class="thumb" src="thumbs/${thumb}" alt="${name}">
        </button>
        <div class="name">${name}</div>
        <div class="path">photos/${name}</div>
      </div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>阿卡罗阿封面候选 · Contact Sheet</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
      background: #e8e6e2;
      color: #1a1a1a;
      padding: clamp(20px, 4vw, 48px);
      line-height: 1.5;
    }
    .wrap { max-width: 1280px; margin: 0 auto; }
    header { margin-bottom: 32px; }
    header h1 {
      font-size: clamp(20px, 3vw, 26px);
      font-weight: 600;
      margin-bottom: 8px;
    }
    header p { font-size: 14px; color: #555; }
    .sheet {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .cell {
      background: #fff;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: 0 4px 18px rgba(0,0,0,.08);
    }
    .cell button {
      display: block;
      width: 100%;
      padding: 0;
      border: none;
      background: none;
      cursor: zoom-in;
    }
    .cell img.thumb {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      display: block;
    }
    .cell .name {
      padding: 12px 14px;
      font-size: 13px;
      font-weight: 600;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      word-break: break-all;
      border-top: 1px solid #eee;
      text-align: center;
    }
    .cell .path {
      padding: 0 14px 12px;
      font-size: 10px;
      color: #888;
      word-break: break-all;
      text-align: center;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
    }
    .lightbox {
      position: fixed;
      inset: 0;
      z-index: 999;
      background: rgba(0,0,0,.9);
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 24px 24px;
    }
    .lightbox.is-open { display: flex; }
    .lightbox img {
      max-width: min(100%, 1400px);
      max-height: calc(100vh - 100px);
      object-fit: contain;
      border-radius: 4px;
    }
    .lightbox .caption {
      margin-top: 16px;
      color: #fff;
      font-size: 14px;
      font-family: ui-monospace, "SF Mono", Menlo, monospace;
      text-align: center;
    }
    .lightbox-close {
      position: absolute;
      top: 12px;
      right: 16px;
      background: none;
      border: none;
      color: #fff;
      font-size: 36px;
      line-height: 1;
      cursor: pointer;
      opacity: .85;
    }
    .lightbox-close:hover { opacity: 1; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>阿卡罗阿封面候选 · Contact Sheet</h1>
      <p>本地预览 · 未修改网站 · 输出目录已 gitignore</p>
    </header>

    <div class="sheet" id="sheet">
${cells}
    </div>
  </div>

  <div class="lightbox" id="lightbox" role="dialog" aria-modal="true" aria-label="大图预览" hidden>
    <button type="button" class="lightbox-close" id="lbClose" aria-label="关闭">&times;</button>
    <img id="lbImg" alt="">
    <p class="caption" id="lbCaption"></p>
  </div>

  <script>
    (function () {
      var lb = document.getElementById("lightbox");
      var lbImg = document.getElementById("lbImg");
      var lbCaption = document.getElementById("lbCaption");
      var lbClose = document.getElementById("lbClose");

      function open(src, name) {
        lbImg.src = src;
        lbCaption.textContent = name;
        lb.hidden = false;
        lb.classList.add("is-open");
        document.body.style.overflow = "hidden";
      }
      function close() {
        lb.hidden = true;
        lb.classList.remove("is-open");
        document.body.style.overflow = "";
        lbImg.removeAttribute("src");
      }

      document.getElementById("sheet").addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-full]");
        if (!btn) return;
        open(btn.dataset.full, btn.dataset.name);
      });
      lbClose.addEventListener("click", close);
      lb.addEventListener("click", function (e) {
        if (e.target === lb) close();
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !lb.hidden) close();
      });
    })();
  </script>
</body>
</html>
`;
}

function main() {
  if (!fs.existsSync(DESKTOP_AKAROA)) {
    console.error(`ERROR: Akaroa source folder not found: ${DESKTOP_AKAROA}`);
    process.exit(1);
  }

  ensureDir(PHOTOS_DIR);
  ensureDir(THUMBS_DIR);

  for (const name of PHOTOS) {
    const src = path.join(DESKTOP_AKAROA, name);
    if (!fs.existsSync(src)) {
      console.error(`ERROR: missing source photo: ${src}`);
      process.exit(1);
    }
    const dest = path.join(PHOTOS_DIR, name);
    if (fs.existsSync(dest)) fs.unlinkSync(dest);
    copyFile(src, dest);
    makeThumb(dest, path.join(THUMBS_DIR, thumbName(name)));
    console.log(`  copied ${name}`);
  }

  fs.writeFileSync(path.join(OUT_DIR, "index.html"), buildHtml(), "utf8");
  console.log(`\nPreview ready: ${OUT_DIR}/index.html`);
  console.log("(gitignored — not deployed to GitHub Pages)");
}

main();
