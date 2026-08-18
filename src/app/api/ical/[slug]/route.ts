import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { getVillaBySlugWithHidden } from "@/lib/data/villas";
import { getBlockedDates } from "@/lib/data/blocked-dates";
import { buildIcalFeed, getIcalConfig, mergeNightsToRanges } from "@/lib/data/ical";
import type { StoredInquiry } from "@/app/api/inquiries/route";

export const dynamic = "force-dynamic";

/**
 * Public (token-secret) iCal feed for one listing — pasted into
 * Airbnb / Booking.com "Import calendar". Exposes only busy dates,
 * never guest details.
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const token = new URL(req.url).searchParams.get("token") ?? "";

  const cfg = await getIcalConfig(slug);
  if (!cfg.token || token !== cfg.token) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }
  const villa = getVillaBySlugWithHidden(slug);
  if (!villa) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const [inquiries, blocked] = await Promise.all([
    readJson<StoredInquiry[]>("inquiries.json", []),
    getBlockedDates(slug),
  ]);

  const entries: Array<{ uid: string; start: string; end: string; summary: string }> = [];

  for (const q of inquiries) {
    if (q.villa !== slug || q.hostDecision !== "accepted") continue;
    if (!q.checkIn || !q.checkOut) continue;
    const start = q.checkIn.slice(0, 10);
    const end = q.checkOut.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end) || end <= start) continue;
    entries.push({ uid: q.id, start, end, summary: "Reserved — Earthy Stays" });
  }

  for (const range of mergeNightsToRanges(blocked)) {
    entries.push({
      uid: `blocked-${slug}-${range.start}`,
      ...range,
      summary: "Not available — Earthy Stays",
    });
  }

  return new NextResponse(buildIcalFeed(villa.name, entries), {
    headers: {
      "content-type": "text/calendar; charset=utf-8",
      "content-disposition": `attachment; filename="${slug}.ics"`,
      "cache-control": "no-cache",
    },
  });
}
