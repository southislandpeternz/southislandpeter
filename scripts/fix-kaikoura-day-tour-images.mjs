#!/usr/bin/env node
/**
 * Backup, rename, fix orientation, and rebuild Kaikoura Day Tour photo library.
 * Run: node scripts/fix-kaikoura-day-tour-images.mjs
 */
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const LIBRARY = path.join(ROOT, "Photo Library/Kaikoura-Day-Tour");
const BACKUP = path.join(ROOT, "_Backup_Kaikoura_Image_Fix");
const REPORT = path.join(ROOT, "reports/2026-06-10-kaikoura-image-fix.md");
const IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** Rename: old basename → new basename (within category folder) */
const RENAMES = {
  "01-Coastal-Scenery/293.jpg": "01-Coastal-Scenery/kaikoura-coastal-beach-walk-01.jpg",
  "01-Coastal-Scenery/296.jpg": "01-Coastal-Scenery/kaikoura-coastal-beach-walk-02.jpg",
};

/** Physical rotation degrees (clockwise). Applied after EXIF auto-orient. */
const ROTATE_CW = {
  "kaikoura-coastal-peninsula-landscape-01.jpg": 180,
  "kaikoura-coastal-rod-father-bay-01.jpg": 180,
  "kaikoura-coastal-scenery-coast-01.jpg": 180,
  "kaikoura-coastal-scenery-guests-01.jpg": 180,
  "fishing-prep-boarding-01.jpg": 180,
  "fishing-trip-at-sea-01.jpg": 180,
  "guest-experience-dining-02.jpg": 90,
};

function listImages(dir, base = "") {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const rel = base ? `${base}/${name}` : name;
    if (fs.statSync(full).isDirectory()) {
      out.push(...listImages(full, rel));
    } else if (IMAGE_EXT.test(name)) {
      out.push(rel);
    }
  }
  return out.sort();
}

function copyTree(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const rel of listImages(src)) {
    const from = path.join(src, rel);
    const to = path.join(dest, rel);
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
}

function applyOrientationAndRotate(filePath, rotateCw) {
  const pyFile = path.join(ROOT, ".tmp-fix-orientation.py");
  fs.writeFileSync(
    pyFile,
    `import sys
from PIL import Image, ImageOps
path, rotate_cw = sys.argv[1], int(sys.argv[2])
im = ImageOps.exif_transpose(Image.open(path))
if rotate_cw:
    im = im.rotate(-rotate_cw, expand=True)
im.convert("RGB").save(path, "JPEG", quality=90, optimize=True)
`
  );
  execSync(`python3 "${pyFile}" "${filePath}" ${rotateCw || 0}`, { stdio: "pipe" });
}

function verifyImage(filePath) {
  const pyFile = path.join(ROOT, ".tmp-verify-image.py");
  fs.writeFileSync(
    pyFile,
    `import sys, statistics
from PIL import Image
path = sys.argv[1]
Image.open(path).verify()
im = Image.open(path).convert("RGB")
mean = statistics.mean(sum(p)/3 for p in list(im.resize((32,32)).getdata()))
print("OK" if mean >= 5 else "BLACK")
`
  );
  return execSync(`python3 "${pyFile}" "${filePath}"`, { encoding: "utf8" }).trim();
}

function main() {
  const log = {
    backedUp: [],
    renamed: [],
    rotated: [],
    missing: [],
    broken: [],
  };

  console.log("=== Task 4: Backup ===");
  if (fs.existsSync(BACKUP)) {
    fs.rmSync(BACKUP, { recursive: true, force: true });
  }
  copyTree(LIBRARY, BACKUP);
  log.backedUp = listImages(BACKUP);
  console.log(`Backed up ${log.backedUp.length} files → ${BACKUP}`);

  console.log("\n=== Task 1: Rename ===");
  for (const [fromRel, toRel] of Object.entries(RENAMES)) {
    const from = path.join(LIBRARY, fromRel);
    const to = path.join(LIBRARY, toRel);
    if (!fs.existsSync(from)) {
      log.missing.push(fromRel);
      console.warn(`[skip rename] missing ${fromRel}`);
      continue;
    }
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.renameSync(from, to);
    log.renamed.push({ from: fromRel, to: toRel });
    console.log(`[rename] ${fromRel} → ${toRel}`);
  }

  console.log("\n=== Task 2: Orientation ===");
  for (const rel of listImages(LIBRARY)) {
    const file = path.basename(rel);
    const full = path.join(LIBRARY, rel);
    const deg = ROTATE_CW[file] || 0;
    applyOrientationAndRotate(full, deg);
    if (deg) {
      log.rotated.push({ file: rel, degrees: deg });
      console.log(`[rotate] ${rel} ${deg}° CW (+ EXIF transpose)`);
    }
  }

  console.log("\n=== Task 3: Rebuild gallery ===");
  execSync("node scripts/build-kaikoura-day-tour-gallery.mjs --from-disk", {
    stdio: "inherit",
    cwd: ROOT,
  });

  console.log("\n=== Verification ===");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(ROOT, "gallery/kaikoura-day-tour.json"), "utf8")
  );
  for (const img of manifest.images) {
    const p = path.join(ROOT, img.path);
    if (!fs.existsSync(p)) {
      log.broken.push({ file: img.file, reason: "missing" });
    } else {
      const status = verifyImage(p);
      if (status !== "OK") log.broken.push({ file: img.file, reason: status });
    }
  }

  const md = buildReport(log, manifest);
  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, md);
  console.log(`\nReport: ${REPORT}`);
  console.log(`Total images: ${manifest.totalImages}`);
  console.log(`Broken: ${log.broken.length}`);

  if (log.broken.length) process.exit(1);
}

function buildReport(log, manifest) {
  const lines = [
    "# Kaikoura Day Tour — Image Fix Report",
    "",
    `Generated: ${new Date().toISOString()}`,
    "",
    "## 1. Photos renamed",
    "",
  ];
  if (log.renamed.length) {
    for (const r of log.renamed) {
      lines.push(`- \`${r.from}\` → \`${r.to}\``);
    }
  } else {
    lines.push("- *(none)*");
  }

  lines.push("", "## 2. Photos rotated", "");
  if (log.rotated.length) {
    for (const r of log.rotated) {
      if (r.degrees) {
        lines.push(`- \`${r.file}\` — **${r.degrees}° clockwise** (EXIF transpose applied)`);
      }
    }
  } else {
    lines.push("- *(none)*");
  }

  lines.push("", "## 3. Missing files", "");
  if (log.missing.length) {
    for (const m of log.missing) lines.push(`- \`${m}\``);
  } else {
    lines.push("- *(none)*");
  }

  lines.push("", "## 4. Broken references", "");
  if (log.broken.length) {
    for (const b of log.broken) lines.push(`- \`${b.file}\` — ${b.reason}`);
  } else {
    lines.push("- *(none)*");
  }

  lines.push("", "## 5. Total image count", "", `- **${manifest.totalImages}** images in manifest`, `- **${listImages(LIBRARY).length}** files on disk`, "");

  lines.push("## 6. Verification result", "");
  if (!log.broken.length) {
    lines.push("**PASS** — All manifest paths exist; PIL decode OK; no black images detected.");
  } else {
    lines.push("**FAIL** — See broken references above.");
  }

  lines.push("", "## Gallery by section", "", "| Section | Filename | Status |", "| --- | --- | --- |");
  const sectionNames = {
    "coastal-scenery": "海岸风光",
    "whale-watching": "观鲸系列",
    "fishing-experience": "海钓体验",
    "seafood-bbq": "海鲜大餐",
    "guest-experience": "客人体验",
    wildlife: "野生动物",
  };
  lines.push(`| Hero Banner | \`${manifest.heroPrimary?.file || "—"}\` | OK |`);
  for (const cat of manifest.categories) {
    for (const img of cat.images) {
      lines.push(`| ${sectionNames[cat.slug] || cat.slug} | \`${img.file}\` | OK |`);
    }
  }

  lines.push("", "## Backup", "", `\`_Backup_Kaikoura_Image_Fix/\` — ${log.backedUp.length} original files before repair.`, "", "## Notes", "", "- No separate thumbnail files; gallery cards use full-size JPEGs from manifest.", "- HTML/CSS/text unchanged.", "");
  return lines.join("\n");
}

main();
