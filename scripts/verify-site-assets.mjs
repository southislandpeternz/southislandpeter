#!/usr/bin/env node
/** Verify local image assets referenced by homepage manifests exist. */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const errors = [];
const ok = [];

function check(rel) {
  const full = path.join(ROOT, rel);
  if (fs.existsSync(full)) {
    ok.push(rel);
    return true;
  }
  errors.push(rel);
  return false;
}

function fromManifest(file, pick) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, file), "utf8"));
  return pick(data);
}

const showcase = fromManifest("gallery/xhs-showcase.json", (d) =>
  d.images.flatMap((i) => [i.full, i.thumbUrl])
);
const reviews = fromManifest("images/网页使用照片集/manifest.json", (d) =>
  d.images.flatMap((i) => [i.full, i.thumbUrl])
);

[...showcase, ...reviews].forEach((p) => check(p));

const report = {
  generatedAt: new Date().toISOString(),
  ok: ok.length,
  missing: errors.length,
  missingFiles: errors
};

const reportDir = path.join(ROOT, "_reports");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "asset-verify.json"),
  JSON.stringify(report, null, 2) + "\n"
);

if (errors.length) {
  console.error(`Missing ${errors.length} files`);
  errors.forEach((e) => console.error("  ", e));
  process.exit(1);
}
console.log(`All ${ok.length} asset paths exist locally.`);
