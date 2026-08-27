import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { requireAdminApi } from "@/lib/admin-auth";

/** Max edge of a saved image. Anything bigger gets resized down. */
const MAX_IMAGE_EDGE_PX = 1800;
/** JPEG quality (0-100). 80 = near-lossless to the eye, ~10× smaller files. */
const JPEG_QUALITY = 80;

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25MB per image
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100MB per video
const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10MB per PDF (brochures)
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
const PDF_TYPES = ["application/pdf"];
const ALLOWED = [...IMAGE_TYPES, ...VIDEO_TYPES, ...PDF_TYPES];

/**
 * Write a file atomically: stream to a temp name in the same directory, then
 * rename into place. rename(2) is atomic on the same filesystem, so a reader
 * either sees the previous file or the complete new one — never a partial.
 *
 * This matters because Next's image optimizer fetches /uploads/* over HTTP
 * and the admin UI renders an image the moment upload responds. A plain
 * fs.writeFile leaves a window where the file exists but is short or empty;
 * the optimizer reads that and fails with "received null". Atomic rename
 * closes the window, which is what let image optimization be re-enabled.
 */
async function writeFileAtomic(filepath: string, data: Buffer): Promise<void> {
  const tmp = `${filepath}.tmp-${crypto.randomBytes(6).toString("hex")}`;
  try {
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, filepath);
  } catch (err) {
    await fs.rm(tmp, { force: true }).catch(() => {});
    throw err;
  }
}


function safeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "photo"
  );
}

/**
 * Full admin check — signature, expiry AND revocation. Identical to what every
 * other admin surface enforces, so this route is not a weaker side door.
 */
async function isAuthed(): Promise<boolean> {
  return (await requireAdminApi()) !== null;
}

export async function POST(req: Request) {
  // Auth check (proxy is bypassed for this route to allow large bodies)
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid form data" }, { status: 400 });
  }

  const files = formData.getAll("file").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "No files received" }, { status: 400 });
  }

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const uploaded: Array<{ url: string; name: string; size: number }> = [];
  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 },
      );
    }
    const isVideo = VIDEO_TYPES.includes(file.type);
    const isPdf = PDF_TYPES.includes(file.type);
    const maxBytes = isPdf ? MAX_PDF_BYTES : isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      const limitMb = isPdf ? "10MB" : isVideo ? "100MB" : "25MB";
      return NextResponse.json(
        {
          ok: false,
          error: `File too large (max ${limitMb}): ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 413 },
      );
    }
    const base = path.basename(file.name, path.extname(file.name));
    const id = crypto.randomBytes(4).toString("hex");
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    if (isPdf) {
      // Verify magic bytes: real PDFs begin with "%PDF-".
      if (
        inputBuffer.length < 5 ||
        inputBuffer.subarray(0, 5).toString("ascii") !== "%PDF-"
      ) {
        return NextResponse.json(
          { ok: false, error: `Not a valid PDF: ${file.name}` },
          { status: 415 },
        );
      }
      const filename = `${Date.now()}-${id}-${safeName(base)}.pdf`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFileAtomic(filepath, inputBuffer);
      uploaded.push({
        url: `/uploads/${filename}`,
        name: file.name,
        size: inputBuffer.length,
      });
      continue;
    }

    if (isVideo) {
      // Videos are saved as-is — no transcoding.
      const ext = path.extname(file.name) || ".mp4";
      const filename = `${Date.now()}-${id}-${safeName(base)}${ext}`;
      const filepath = path.join(UPLOAD_DIR, filename);
      await writeFileAtomic(filepath, inputBuffer);
      uploaded.push({
        url: `/uploads/${filename}`,
        name: file.name,
        size: inputBuffer.length,
      });
      continue;
    }

    // Images: resize down to MAX_IMAGE_EDGE_PX (preserving aspect) and
    // re-encode as JPEG at JPEG_QUALITY. A 5MB DSLR photo typically becomes
    // ~300-600KB at this setting with no perceptible quality loss.
    //
    // We also strip EXIF/orientation metadata (sharp's rotate() bakes
    // orientation into the pixels so the image displays correctly without
    // it), reducing size further and removing camera serial/geo tags.
    let outputBuffer: Buffer;
    try {
      outputBuffer = await sharp(inputBuffer)
        .rotate() // honour EXIF orientation, then strip it
        .resize({
          width: MAX_IMAGE_EDGE_PX,
          height: MAX_IMAGE_EDGE_PX,
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
    } catch (err) {
      console.error("[upload] sharp compression failed", file.name, err);
      return NextResponse.json(
        { ok: false, error: `Could not process image: ${file.name}` },
        { status: 422 },
      );
    }

    // All images saved as .jpg (the JPEG re-encode means the extension
    // matches the actual format on disk).
    const filename = `${Date.now()}-${id}-${safeName(base)}.jpg`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFileAtomic(filepath, outputBuffer);

    uploaded.push({
      url: `/uploads/${filename}`,
      name: file.name,
      size: outputBuffer.length,
    });
  }

  return NextResponse.json({ ok: true, files: uploaded });
}

export const runtime = "nodejs";
