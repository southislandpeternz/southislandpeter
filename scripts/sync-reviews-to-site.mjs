#!/usr/bin/env node
/**
 * Sync featured reviews from Desktop Reviews center into website assets.
 * Reads reviews-content.csv, copies images, writes featured-manifest.json.
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const CSV_PATH = process.argv[2] || "/Users/yueshe/Desktop/NZ-Travel-photos /reviews-content.csv";
const FEATURED_SRC = path.join(path.dirname(CSV_PATH), "Reviews/精选评价");
const OUT_DIR = path.join(ROOT, "images/网页使用照片集/reviews/featured");
const MANIFEST = path.join(ROOT, "reviews/featured-manifest.json");

function parseCsv(text) {
  const rows = [];
  let i = 0;
  const lines = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of text) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      cur += ch;
    } else if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (cur.trim()) lines.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) lines.push(cur);
  const header = splitCsvLine(lines[0]);
  for (let n = 1; n < lines.length; n++) {
    const cols = splitCsvLine(lines[n]);
    const row = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] || "").replace(/^"|"$/g, "").replace(/""/g, '"');
    });
    rows.push(row);
  }
  return rows;
}

function splitCsvLine(line) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function cleanDisplay(text) {
  let t = text
    .replace(/Petera/gi, "Peter")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/^[\u4e00-\u9fa5A-Za-z0-9_\-\s·]{2,18}\s+/, "");
  if (t.length > 160) {
    const cut = t.slice(0, 160);
    const p = Math.max(cut.lastIndexOf("。"), cut.lastIndexOf("！"), cut.lastIndexOf("!"));
    t = p > 40 ? cut.slice(0, p + 1) : cut.trim() + "…";
  }
  return t;
}

function platformClass(platform) {
  const p = (platform || "").toLowerCase();
  if (p.includes("google")) return "google";
  if (p.includes("微信") || p.includes("wechat")) return "wechat";
  if (p.includes("trip")) return "tripadvisor";
  return "feedback";
}

function buildMedia(row, rel) {
  const cls = platformClass(row.Platform);
  const cat = (row.Category || "").toLowerCase();
  const media = { wechat: null, google: null, feedback: null, guestPhoto: null };

  if (cls === "wechat") media.wechat = rel;
  else if (cls === "google") media.google = rel;
  else if (cat.includes("合影") || cat.includes("guest")) media.guestPhoto = rel;
  else media.feedback = rel;

  return media;
}

function hasSips() {
  try {
    execSync("which sips", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function optimize(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  if (hasSips() && /\.(jpe?g|png|webp)$/i.test(src)) {
    execSync(`sips -Z 1200 -s format jpeg -s formatOptions 85 "${src}" --out "${dest}"`, {
      stdio: "ignore"
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error("CSV not found:", CSV_PATH);
    process.exit(1);
  }
  const rows = parseCsv(fs.readFileSync(CSV_PATH, "utf8"));
  if (fs.existsSync(OUT_DIR)) {
    for (const f of fs.readdirSync(OUT_DIR)) {
      fs.unlinkSync(path.join(OUT_DIR, f));
    }
  } else {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const images = [];
  for (const row of rows) {
    const rank = Number(row.Rank);
    if (!rank) continue;
    const srcName = path.basename(row.ImagePath || "");
    const srcFile = path.join(FEATURED_SRC, srcName);
    if (!fs.existsSync(srcFile)) {
      console.warn("Missing:", srcFile);
      continue;
    }
    const outName = `featured-${String(rank).padStart(2, "0")}.jpg`;
    const outPath = path.join(OUT_DIR, outName);
    optimize(srcFile, outPath);
    const rel = `images/网页使用照片集/reviews/featured/${outName}`;
    images.push({
      rank,
      guestLabel: row.GuestLabel,
      platform: row.Platform,
      platformClass: platformClass(row.Platform),
      category: row.Category || "",
      titleZh: row.TitleZH,
      titleEn: row.TitleEN,
      originalText: row.OriginalText,
      displayText: cleanDisplay(row.DisplayText || row.OriginalText),
      image: rel,
      thumb: rel,
      media: buildMedia(row, rel),
      stars: 5,
      score: Number(row.Score) || 0
    });
  }

  images.sort((a, b) => a.rank - b.rank);
  const manifest = {
    generatedAt: new Date().toISOString(),
    sourceCsv: CSV_PATH,
    count: images.length,
    images
  };
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Synced ${images.length} featured reviews → ${OUT_DIR}`);
  console.log(`Manifest: ${MANIFEST}`);
}

main();
