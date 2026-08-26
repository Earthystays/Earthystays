/**
 * One-off: re-compress legacy uploaded images through the SAME pipeline
 * /api/admin/upload has used since the resize cap was added.
 *
 *   sharp(input).rotate().resize(1800 inside, no enlargement).jpeg(q80, mozjpeg)
 *
 * Files uploaded before that cap went in are still full-resolution DSLR
 * originals, and `next.config.ts` sets `images.unoptimized: true`, so they are
 * served to browsers byte-for-byte.
 *
 * Safety rules:
 *   • filenames are preserved exactly — every existing reference keeps working
 *   • videos and PDFs are never touched
 *   • output is written only when it is genuinely smaller than the input
 *   • each output is re-opened and validated before it replaces the original
 *   • writes go to a temp file then rename (atomic; no half-written image)
 *
 * Usage:
 *   node scripts/recompress-uploads.mjs           # dry run, writes nothing
 *   node scripts/recompress-uploads.mjs --execute
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_EDGE_PX = 1800;
const JPEG_QUALITY = 80;
const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

const execute = process.argv.includes("--execute");

function mb(bytes) {
  return (bytes / 1_048_576).toFixed(2);
}

const results = [];
let before = 0;
let after = 0;
let skipped = 0;
let failed = 0;

const entries = await fs.readdir(UPLOAD_DIR, { withFileTypes: true });

for (const entry of entries) {
  if (!entry.isFile()) continue;
  const ext = path.extname(entry.name).toLowerCase();
  if (!IMAGE_EXT.has(ext)) continue; // videos, PDFs, anything else

  const filePath = path.join(UPLOAD_DIR, entry.name);
  const input = await fs.readFile(filePath);

  let meta;
  try {
    meta = await sharp(input).metadata();
  } catch {
    console.log(`  !  ${entry.name} — unreadable, left untouched`);
    failed++;
    continue;
  }

  let output;
  try {
    output = await sharp(input)
      .rotate()
      .resize({
        width: MAX_IMAGE_EDGE_PX,
        height: MAX_IMAGE_EDGE_PX,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();
  } catch (err) {
    console.log(`  !  ${entry.name} — sharp failed: ${err.message}`);
    failed++;
    continue;
  }

  // Never make a file bigger. Already-optimised images fall out here.
  if (output.length >= input.length) {
    skipped++;
    before += input.length;
    after += input.length;
    continue;
  }

  // Validate the replacement actually decodes before trusting it.
  let outMeta;
  try {
    outMeta = await sharp(output).metadata();
    if (!outMeta.width || !outMeta.height) throw new Error("no dimensions");
  } catch (err) {
    console.log(`  !  ${entry.name} — output failed validation: ${err.message}`);
    failed++;
    continue;
  }

  before += input.length;
  after += output.length;
  results.push({
    name: entry.name,
    fromBytes: input.length,
    toBytes: output.length,
    fromDim: `${meta.width}x${meta.height}`,
    toDim: `${outMeta.width}x${outMeta.height}`,
  });

  if (execute) {
    const tmp = `${filePath}.recompress.tmp`;
    await fs.writeFile(tmp, output);
    await fs.rename(tmp, filePath); // atomic replace
  }
}

results.sort((a, b) => b.fromBytes - a.fromBytes);

console.log(`\n${execute ? "REWROTE" : "DRY RUN — would rewrite"} ${results.length} image(s)`);
console.log(`skipped (already optimal): ${skipped}   failed: ${failed}\n`);

console.log("largest changes:");
for (const r of results.slice(0, 12)) {
  const pct = Math.round((1 - r.toBytes / r.fromBytes) * 100);
  console.log(
    `  ${mb(r.fromBytes).padStart(6)} MB -> ${mb(r.toBytes).padStart(6)} MB  (-${String(pct).padStart(2)}%)  ` +
      `${r.fromDim.padStart(10)} -> ${r.toDim.padStart(9)}  ${r.name.slice(0, 40)}`,
  );
}

console.log(
  `\nTOTAL  ${mb(before)} MB -> ${mb(after)} MB  ` +
    `(saved ${mb(before - after)} MB, ${Math.round((1 - after / before) * 100)}%)`,
);
if (!execute) console.log("\nNothing was written. Re-run with --execute to apply.");
