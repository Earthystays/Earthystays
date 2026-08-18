import Link from "next/link";
import { requireHost } from "@/lib/host-auth";
import { getBlockedDates } from "@/lib/data/blocked-dates";
import { getThreadsForHost } from "@/lib/data/messages";
import {
  ensureIcalConfig,
  getImportedBusyRanges,
  isSyncStale,
  syncIcalImports,
} from "@/lib/data/ical";
import { getHostData } from "@/lib/host-metrics";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import { HostBookingCalendar, type CalBooking } from "@/components/host/host-booking-calendar";
import { CalendarSync } from "@/components/host/calendar-sync";

export const dynamic = "force-dynamic";
export const metadata = { title: "Calendar · Hosting" };

function nightsBetween(ci: string, co: string): number {
  return Math.round((new Date(`${co}T00:00:00`).getTime() - new Date(`${ci}T00:00:00`).getTime()) / 864e5);
}

export default async function HostCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string }>;
}) {
  const user = await requireHost();
  const sp = await searchParams;
  const data = await getHostData(user.id);
  const listings = data.listings.filter(
    (l) => l.status === "approved" || l.status === "pending_review" || l.status === "hidden",
  );

  if (listings.length === 0) {
    return (
      <div className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-3xl sm:text-4xl">Calendar</h1>
        <div className="mt-8 rounded-2xl border border-border/70 px-5 py-16 text-center">
          <p className="text-lg font-medium">No listings to manage yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Once you have a listing, bookings and blocked dates show up here.
          </p>
          <Link
            href="/host/listings/new"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Create a listing
          </Link>
        </div>
      </div>
    );
  }

  const selected = listings.find((l) => l.slug === sp.listing) ?? listings[0];

  // OTA calendars refresh on a multi-hour cadence — piggyback on page loads
  // rather than running a scheduler.
  let icalConfig = await ensureIcalConfig(selected.slug);
  if (isSyncStale(icalConfig)) {
    icalConfig = await syncIcalImports(selected.slug);
  }

  const [blockedDates, threads, inquiries, externalBusy] = await Promise.all([
    getBlockedDates(selected.slug),
    getThreadsForHost(user.id),
    readJson<StoredInquiry[]>("inquiries.json", []),
    getImportedBusyRanges(selected.slug),
  ]);

  const origin = process.env.GOOGLE_REDIRECT_URI
    ? new URL(process.env.GOOGLE_REDIRECT_URI).origin
    : "http://localhost:3001";
  const exportUrl = `${origin}/api/ical/${selected.slug}?token=${icalConfig.token}`;
  const threadByInquiry = new Map(threads.map((t) => [t.inquiryId, t.id]));

  /* Confirmed stays from accepted requests; pending dated requests as tentative. */
  const calBookings: CalBooking[] = data.bookings
    .filter((b) => b.villa.slug === selected.slug)
    .map((b) => ({
      id: b.inquiry.id,
      guest: b.inquiry.name,
      checkIn: b.inquiry.checkIn!.slice(0, 10),
      checkOut: b.inquiry.checkOut!.slice(0, 10),
      guests: b.inquiry.guests,
      price: b.villa.pricePerNight,
      nights: b.nights,
      amount: b.amount,
      status: "confirmed" as const,
      threadId: threadByInquiry.get(b.inquiry.id),
    }));
  for (const q of inquiries) {
    if (q.villa !== selected.slug || q.hostDecision || !q.checkIn || !q.checkOut) continue;
    if (!/^\d{4}-\d{2}-\d{2}/.test(q.checkIn) || !/^\d{4}-\d{2}-\d{2}/.test(q.checkOut)) continue;
    const ci = q.checkIn.slice(0, 10);
    const co = q.checkOut.slice(0, 10);
    const nights = nightsBetween(ci, co);
    if (nights <= 0) continue;
    calBookings.push({
      id: q.id,
      guest: q.name,
      checkIn: ci,
      checkOut: co,
      guests: q.guests,
      price: selected.pricePerNight,
      nights,
      amount: nights * selected.pricePerNight,
      status: "tentative",
      threadId: threadByInquiry.get(q.id),
    });
  }

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Calendar</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">{selected.name}</p>
        </div>
        {listings.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {listings.map((l) => (
              <Link
                key={l.slug}
                href={`/host/calendar?listing=${l.slug}`}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  l.slug === selected.slug
                    ? "border-foreground bg-foreground text-background"
                    : "border-border hover:border-foreground/40"
                }`}
              >
                {l.name.length > 28 ? l.name.slice(0, 28) + "…" : l.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6">
        <HostBookingCalendar
          key={selected.slug}
          slug={selected.slug}
          bookings={calBookings}
          blockedDates={blockedDates}
          external={externalBusy.map((e) => ({ start: e.start, end: e.end, sourceName: e.sourceName }))}
        />
      </div>

      <div className="mt-6">
        <CalendarSync
          key={`sync-${selected.slug}`}
          slug={selected.slug}
          exportUrl={exportUrl}
          imports={icalConfig.imports}
        />
      </div>
    </div>
  );
}
