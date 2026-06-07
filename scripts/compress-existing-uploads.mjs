#!/usr/bin/env node
/**
 * One-off: compress every image already in public/uploads/ in place.
 *
 * Resizes to max 1800px edge + JPEG quality 80, exactly matching what
 * the upload endpoint now does for new images. Already-compressed files
 * (already < 1MB and small dimensions) get a soft skip.
 *
 * Run on the VPS once:
 *   cd /var/www/earthystays
 *   node scripts/compress-existing-uploads.mjs
 *
 * Safe to re-run — files smaller than the threshold are skipped.
 * Originals are NOT preserved (no .bak) because the previous DSLR
 * versions are bigger than needed and there's no use for them.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_EDGE = 1800;
const QUALITY = 80;
const SKIP_IF_SMALLER_THAN = 800 * 1024; // 800KB — already small enough

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

let processed = 0;
let skipped = 0;
let savedBytes = 0;

const entries = await fs.readdir(UPLOAD_DIR);
for (const name of entries) {
  const ext = path.extname(name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) continue;
  const full = path.join(UPLOAD_DIR, name);
  const stat = await fs.stat(full);
  if (stat.size < SKIP_IF_SMALLER_THAN) {
    skipped++;
    continue;
  }
  try {
    const buffer = await fs.readFile(full);
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: QUALITY, mozjpeg: true })
      .toBuffer();
    if (out.length >= stat.size) {
      // Compressed version is larger — keep original.
      skipped++;
      continue;
    }
    await fs.writeFile(full, out);
    savedBytes += stat.size - out.length;
    processed++;
    const beforeMB = (stat.size / 1024 / 1024).toFixed(2);
    const afterMB = (out.length / 1024 / 1024).toFixed(2);
    console.log(`✓ ${name}  ${beforeMB}MB → ${afterMB}MB`);
  } catch (err) {
    console.error(`✗ ${name} — ${err.message}`);
    skipped++;
  }
}

const savedMB = (savedBytes / 1024 / 1024).toFixed(1);
console.log(
  `\nDone. Compressed ${processed} files, skipped ${skipped}. Total saved: ${savedMB}MB.`,
);
