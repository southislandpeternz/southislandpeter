#!/usr/bin/env node
/**
 * Fail if git-tracked files exceed GitHub Pages 1 GB site limit,
 * contain symlinks, or include dev-only folders that break artifact upload.
 * Run before push: node scripts/check-github-pages-size.mjs
 */
import { execSync } from "child_process";
import fs from "fs";

const LIMIT_MB = 950;
const FORBIDDEN_PREFIXES = ["_previews/", "_backups/", "Photos/Kaikoura_MASTER/"];
const files = execSync("git ls-files -z", { encoding: "buffer" })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

let totalKb = 0;
const large = [];
const symlinks = [];
const forbidden = [];

for (const file of files) {
  if (FORBIDDEN_PREFIXES.some((prefix) => file.startsWith(prefix))) {
    forbidden.push(file);
  }

  try {
    const stat = fs.lstatSync(file);
    if (stat.isSymbolicLink()) {
      symlinks.push({ file, target: fs.readlinkSync(file) });
      continue;
    }
    const kb = Math.ceil(stat.size / 1024);
    totalKb += kb;
    if (kb > 50 * 1024) large.push({ file, mb: (kb / 1024).toFixed(1) });
  } catch {
    console.warn(`[warn] missing tracked file: ${file}`);
  }
}

const totalMb = totalKb / 1024;
console.log(`GitHub Pages size check: ${totalMb.toFixed(1)} MB / ${LIMIT_MB} MB limit (${files.length} files)`);

if (large.length) {
  console.log("\nFiles over 50 MB:");
  for (const { file, mb } of large.sort((a, b) => b.mb - a.mb)) {
    console.log(`  ${mb} MB  ${file}`);
  }
}

let failed = false;

if (forbidden.length) {
  failed = true;
  console.error("\nERROR: dev-only paths must not be tracked (breaks GitHub Pages artifact upload):");
  for (const file of forbidden) {
    console.error(`  ${file}`);
  }
  console.error("Remove with: git rm -r --cached <path>");
}

if (symlinks.length) {
  failed = true;
  console.error("\nERROR: tracked symlinks break GitHub Pages (\"File removed before we read it\"):");
  for (const { file, target } of symlinks) {
    console.error(`  ${file} -> ${target}`);
  }
  console.error("Replace with real files or remove from git. Local preview: node scripts/build-akaroa-contact-sheet-preview.mjs");
}

if (totalMb > LIMIT_MB) {
  failed = true;
  console.error(`\nERROR: tracked files exceed ${LIMIT_MB} MB — GitHub Pages deploy will fail at "Upload artifact".`);
}

if (failed) process.exit(1);

console.log("OK — within GitHub Pages limit, no symlinks or forbidden paths.");
