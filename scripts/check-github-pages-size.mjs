#!/usr/bin/env node
/**
 * Fail if git-tracked files exceed GitHub Pages 1 GB site limit.
 * Run before push: node scripts/check-github-pages-size.mjs
 */
import { execSync } from "child_process";
import fs from "fs";

const LIMIT_MB = 950;
const files = execSync("git ls-files -z", { encoding: "buffer" })
  .toString("utf8")
  .split("\0")
  .filter(Boolean);

let totalKb = 0;
const large = [];

for (const file of files) {
  try {
    const kb = Math.ceil(fs.statSync(file).size / 1024);
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

if (totalMb > LIMIT_MB) {
  console.error(`\nERROR: tracked files exceed ${LIMIT_MB} MB — GitHub Pages deploy will fail at "Upload artifact".`);
  process.exit(1);
}

console.log("OK — within GitHub Pages limit.");
