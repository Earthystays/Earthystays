import { NextResponse } from "next/server";
import { readArticles, saveArticles } from "@/lib/data/journal";

export const runtime = "nodejs";

type TrackEvent =
  | "view"
  | "property_click"
  | "experience_click"
  | "booking_click"
  | "share";

const FIELD: Record<TrackEvent, keyof Awaited<ReturnType<typeof readArticles>>[number]> = {
  view: "views",
  property_click: "propertyClicks",
  experience_click: "experienceClicks",
  booking_click: "bookingClicks",
  share: "shares",
};

export async function POST(req: Request) {
  let body: { slug?: string; event?: TrackEvent };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { slug, event } = body;
  if (!slug || !event || !(event in FIELD)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const articles = await readArticles();
  const article = articles.find((a) => a.slug === slug);
  if (!article) return NextResponse.json({ ok: false }, { status: 404 });

  const field = FIELD[event];
  const rec = article as unknown as Record<string, number>;
  rec[field] = (rec[field] ?? 0) + 1;
  await saveArticles(articles);

  return NextResponse.json({ ok: true });
}
