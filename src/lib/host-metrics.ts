import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import type { Villa } from "@/lib/types";
import { getVillasByHost } from "@/lib/data/villas";
import { getBlockedDates } from "@/lib/data/blocked-dates";
import { getThreadsForHost, unreadCount, type MessageThread } from "@/lib/data/messages";

/** An accepted booking request with parseable dates, priced from the listing. */
export type HostBooking = {
  inquiry: StoredInquiry;
  villa: Villa;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  amount: number; // nights × pricePerNight (indicative — concierge settles offline)
};

export type HostData = {
  listings: Villa[];
  requests: StoredInquiry[]; // every request for this host's listings
  pending: StoredInquiry[];
  bookings: HostBooking[]; // accepted, dated, sorted by check-in
  threads: MessageThread[];
  unreadMessages: number;
  blockedBySlug: Record<string, string[]>;
};

function parseDay(s?: string): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}/.test(s)) return null;
  const d = new Date(`${s.slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Load everything host pages compute from, in one pass. */
export async function getHostData(hostId: string): Promise<HostData> {
  const listings = getVillasByHost(hostId);
  const bySlug = new Map(listings.map((l) => [l.slug, l]));

  const [inquiries, threads, ...blockedLists] = await Promise.all([
    readJson<StoredInquiry[]>("inquiries.json", []),
    getThreadsForHost(hostId),
    ...listings.map((l) => getBlockedDates(l.slug)),
  ]);

  const blockedBySlug: Record<string, string[]> = {};
  listings.forEach((l, i) => {
    blockedBySlug[l.slug] = blockedLists[i] as string[];
  });

  const requests = inquiries.filter((q) => q.villa && bySlug.has(q.villa));
  const pending = requests.filter((q) => !q.hostDecision);

  const bookings: HostBooking[] = [];
  for (const q of requests) {
    if (q.hostDecision !== "accepted") continue;
    const villa = bySlug.get(q.villa!)!;
    const checkIn = parseDay(q.checkIn);
    const checkOut = parseDay(q.checkOut);
    if (!checkIn || !checkOut || checkOut <= checkIn) continue;
    const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 864e5);
    bookings.push({ inquiry: q, villa, checkIn, checkOut, nights, amount: nights * villa.pricePerNight });
  }
  bookings.sort((a, b) => a.checkIn.getTime() - b.checkIn.getTime());

  const unreadMessages = threads.reduce((n, t) => n + unreadCount(t, "host"), 0);

  return { listings, requests, pending, bookings, threads, unreadMessages, blockedBySlug };
}

/** True when the stay covers the night starting on `day`. */
export function occupiesNight(b: HostBooking, day: Date): boolean {
  return b.checkIn <= day && day < b.checkOut;
}

export function bookingsForMonth(bookings: HostBooking[], year: number, month: number): HostBooking[] {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);
  return bookings.filter((b) => b.checkIn < end && b.checkOut > start);
}

/** Revenue earned per calendar day of a month (a stay's amount is spread
 *  across its nights). Returns one number per day of the month. */
export function dailyRevenue(bookings: HostBooking[], year: number, month: number): number[] {
  const days = new Date(year, month + 1, 0).getDate();
  const out = new Array<number>(days).fill(0);
  for (const b of bookings) {
    const perNight = b.villa.pricePerNight;
    for (let i = 0; i < days; i++) {
      const day = new Date(year, month, i + 1);
      if (occupiesNight(b, day)) out[i] += perNight;
    }
  }
  return out;
}

/** Occupancy % for a listing set over a month: booked nights / available
 *  nights (blocked nights are excluded from the denominator). */
export function occupancyPct(
  listings: Villa[],
  bookings: HostBooking[],
  blockedBySlug: Record<string, string[]>,
  year: number,
  month: number,
  onlySlug?: string,
): number {
  const days = new Date(year, month + 1, 0).getDate();
  let booked = 0;
  let available = 0;
  for (const l of listings) {
    if (onlySlug && l.slug !== onlySlug) continue;
    const blocked = new Set(blockedBySlug[l.slug] ?? []);
    for (let i = 0; i < days; i++) {
      const day = new Date(year, month, i + 1);
      if (blocked.has(dayKey(day))) continue;
      available++;
      if (bookings.some((b) => b.villa.slug === l.slug && occupiesNight(b, day))) booked++;
    }
  }
  return available === 0 ? 0 : Math.round((booked / available) * 100);
}

export { formatINR, formatINRCompact } from "@/lib/format";
