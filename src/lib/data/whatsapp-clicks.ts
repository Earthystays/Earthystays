import { appendJson, readJsonSync } from "@/lib/storage";

/**
 * A single WhatsApp button click captured from the public site.
 *
 * `source` describes which button was tapped (e.g. `float` for the bottom-
 * right floating bubble, `header-desktop` for the "Get in touch" dropdown
 * on desktop, `header-mobile` for the mobile drawer, `why-section` for the
 * "Contact via WhatsApp" CTA in the home Why block, `villa-sidebar` for the
 * WhatsApp button in the villa detail sidebar).
 *
 * `villa` is set only when the click originated from a villa detail page,
 * so the admin dashboard can attribute clicks to the right property.
 */
export type WhatsAppClick = {
  ts: string;
  source: string;
  villa?: string;
};

const FILE = "whatsapp-clicks.json";

export async function recordWhatsAppClick(input: {
  source: string;
  villa?: string;
}): Promise<void> {
  const entry: WhatsAppClick = {
    ts: new Date().toISOString(),
    source: input.source.slice(0, 40),
    ...(input.villa ? { villa: input.villa.slice(0, 80) } : {}),
  };
  await appendJson<WhatsAppClick>(FILE, entry);
}

/** Sync read used by the admin dashboard (server component). */
export function getWhatsAppClicksSync(): WhatsAppClick[] {
  return readJsonSync<WhatsAppClick[]>(FILE, []);
}

/**
 * Click metrics scoped to a date window. `inRange` counts clicks between
 * `start` and `end` (epoch ms, inclusive); `prev` counts the equal-length
 * period immediately before it, and `delta` is the % change between the
 * two. `byVilla` only counts in-range clicks so property attribution
 * follows the dashboard's selected range. Defaults to the current
 * calendar month when no range is given.
 */
export function computeWhatsAppMetrics(range?: { start: number; end: number }) {
  const clicks = getWhatsAppClicksSync();
  const now = Date.now();
  const start =
    range?.start ??
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
  const end = range?.end ?? now;
  const prevStart = start - (end - start);

  let inRange = 0;
  let prev = 0;
  const byVilla: Record<string, number> = {};

  for (const c of clicks) {
    const t = new Date(c.ts).getTime();
    if (t >= start && t <= end) {
      inRange++;
      if (c.villa) byVilla[c.villa] = (byVilla[c.villa] ?? 0) + 1;
    } else if (t >= prevStart && t < start) {
      prev++;
    }
  }

  const delta =
    prev === 0 ? null : Math.round(((inRange - prev) / prev) * 100);

  return { total: clicks.length, inRange, prev, delta, byVilla };
}
