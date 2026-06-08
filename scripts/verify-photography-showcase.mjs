#!/usr/bin/env node
/** Verify photography-showcase manifest paths exist locally and resolve from any page depth. */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "gallery/photography-showcase.json");
const errors = [];
const ok = [];

function check(rel) {
  const clean = String(rel).replace(/\\/g, "/").replace(/^\//, "");
  const full = path.join(ROOT, clean);
  if (fs.existsSync(full)) {
    const stat = fs.statSync(full);
    if (stat.size < 500) {
      errors.push({ path: clean, reason: `too small (${stat.size} bytes)` });
      return false;
    }
    ok.push(clean);
    return true;
  }
  errors.push({ path: clean, reason: "missing" });
  return false;
}

const data = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));
const paths = new Set();

if (data.hero) {
  paths.add(data.hero.full);
  paths.add(data.hero.thumbUrl);
}
(data.featured || []).forEach((img) => {
  paths.add(img.full);
  paths.add(img.thumbUrl);
});
(data.themes || []).forEach((theme) => {
  (theme.images || []).forEach((img) => {
    paths.add(img.full);
    paths.add(img.thumbUrl);
  });
});

[...paths].forEach((p) => check(p));

const report = {
  generatedAt: new Date().toISOString(),
  manifest: "gallery/photography-showcase.json",
  total: paths.size,
  ok: ok.length,
  missing: errors.length,
  errors
};

const reportDir = path.join(ROOT, "_reports");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "photography-showcase-verify.json"),
  JSON.stringify(report, null, 2) + "\n"
);

if (errors.length) {
  console.error(`Missing or invalid: ${errors.length} / ${paths.size}`);
  errors.forEach((e) => console.error(`  ${e.path}: ${e.reason}`));
  process.exit(1);
}
console.log(`All ${ok.length} photography-showcase assets exist locally.`);
