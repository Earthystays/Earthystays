import { NextResponse } from "next/server";
import { z } from "zod";
import { recordWhatsAppClick } from "@/lib/data/whatsapp-clicks";

const Schema = z.object({
  source: z.string().min(1).max(40),
  villa: z.string().min(1).max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    await recordWhatsAppClick(parsed.data);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
