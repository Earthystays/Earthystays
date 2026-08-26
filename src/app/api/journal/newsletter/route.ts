import { NextResponse } from "next/server";
import { subscribe } from "@/lib/data/journal-newsletter";

export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const email = String(body.email ?? "").trim();
  if (!email) {
    return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
  }
  const result = await subscribe(email, body.source || "journal");
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
