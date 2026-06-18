import { NextRequest, NextResponse } from "next/server";
import { recordView } from "@/lib/data/villa-views";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let slug = "";
  try {
    const body = await req.json();
    if (typeof body?.slug === "string") slug = body.slug.trim();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  await recordView(slug);
  return NextResponse.json({ ok: true });
}
