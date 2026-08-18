import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { getCurrentUser } from "@/lib/session";

/** Host photo uploads — same processing pipeline as the admin uploader,
 *  but authenticated against the guest/host session instead of the admin
 *  cookie, images only (hosts don't upload videos in v1). */
const MAX_IMAGE_EDGE_PX = 1800;
const JPEG_QUALITY = 80;
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "host");
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];

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

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user?.isHost) {
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
    if (!IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: `Unsupported file type: ${file.type}` },
        { status: 415 },
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `File too large (max 25MB): ${file.name} is ${(file.size / 1024 / 1024).toFixed(1)}MB`,
        },
        { status: 413 },
      );
    }
    const base = path.basename(file.name, path.extname(file.name));
    const id = crypto.randomBytes(4).toString("hex");
    const inputBuffer = Buffer.from(await file.arrayBuffer());

    let outputBuffer: Buffer;
    try {
      outputBuffer = await sharp(inputBuffer)
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
      console.error("[host upload] sharp compression failed", file.name, err);
      return NextResponse.json(
        { ok: false, error: `Could not process image: ${file.name}` },
        { status: 422 },
      );
    }

    const filename = `${Date.now()}-${id}-${safeName(base)}.jpg`;
    await fs.writeFile(path.join(UPLOAD_DIR, filename), outputBuffer);
    uploaded.push({
      url: `/uploads/host/${filename}`,
      name: file.name,
      size: outputBuffer.length,
    });
  }

  return NextResponse.json({ ok: true, files: uploaded });
}
