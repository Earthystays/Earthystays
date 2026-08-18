import Link from "next/link";
import Image from "next/image";
import { Camera, ChevronRight, MapPin, Star, CalendarDays, Tag, BarChart3, Plus } from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import {
  bookingsForMonth,
  dailyRevenue,
  formatINR,
  formatINRCompact,
  getHostData,
  occupancyPct,
  type HostBooking,
} from "@/lib/host-metrics";
import type { Villa } from "@/lib/types";
import { StatusPill } from "@/components/host/status-pill";
import { ListingRowActions } from "@/components/host/listing-row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your listings · Hosting" };

const TYPE_LABEL: Record<string, string> = { villa: "Villa", apartment: "Apartment" };

function monthMetrics(
  listing: Villa,
  bookings: HostBooking[],
  blockedBySlug: Record<string, string[]>,
  year: number,
  month: number,
) {
  const mine = bookings.filter((b) => b.villa.slug === listing.slug);
  const inMonth = bookingsForMonth(mine, year, month);
  const revenue = dailyRevenue(inMonth, year, month).reduce((a, b) => a + b, 0);
  const occ = occupancyPct([listing], mine, blockedBySlug, year, month, listing.slug);
  return { revenue, occ, count: inMonth.length };
}

function Delta({ now, before, invertZero }: { now: number; before: number; invertZero?: boolean }) {
  if (before === 0) {
    return <p className="mt-1 text-xs text-muted-foreground">{invertZero ? "—" : "new this month"}</p>;
  }
  const pct = Math.round(((now - before) / before) * 100);
  return (
    <>
      <p className={`mt-1 text-xs font-medium ${pct >= 0 ? "text-emerald-700" : "text-destructive"}`}>
        {pct >= 0 ? "↑" : "↓"} {Math.abs(pct)}%
      </p>
      <p className="text-[11px] text-muted-foreground">vs last month</p>
    </>
  );
}

export default async function HostListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; saved?: string }>;
}) {
  const user = await requireHost();
  const sp = await searchParams;
  const data = await getHostData(user.id);
  const listings = [...data.listings].sort(
    (a, b) => (a.status === "rejected" ? 0 : 1) - (b.status === "rejected" ? 0 : 1),
  );

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const prev = new Date(year, month - 1, 1);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Your listings</h1>
          <p className="mt-1.5 text-[15px] text-muted-foreground">
            Manage your properties, pricing, availability and performance.
          </p>
        </div>
        <Link
          href="/host/listings/new"
          className="flex shrink-0 items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Create new listing</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {sp.submitted && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
          Submitted for review. The Earthy Stays team checks every listing — usually within
          24 hours. You&apos;ll see the status change here once it&apos;s approved.
        </div>
      )}
      {sp.saved && (
        <div className="mt-6 rounded-xl border border-border bg-muted/40 px-5 py-4 text-sm text-muted-foreground">
          Saved. Pick up where you left off anytime.
        </div>
      )}

      {listings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-border/70 px-5 py-16 text-center">
          <p className="text-lg font-medium">No listings yet</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first listing — it takes about 10 minutes and our team reviews it
            before it goes live.
          </p>
          <Link
            href="/host/listings/new"
            className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Get started
          </Link>
        </div>
      ) : (
        <div className="mt-7 space-y-5">
          {listings.map((l) => {
            const cur = monthMetrics(l, data.bookings, data.blockedBySlug, year, month);
            const before = monthMetrics(l, data.bookings, data.blockedBySlug, prev.getFullYear(), prev.getMonth());
            const img = l.images[0];
            return (
              <div
                key={l.slug}
                className="flex flex-col gap-5 rounded-2xl border border-border/60 bg-background p-4 lg:flex-row lg:items-stretch"
              >
                {/* photo */}
                <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-xl bg-muted lg:h-auto lg:w-[230px]">
                  {img && (
                    <Image src={img.src} alt={img.alt ?? l.name} fill sizes="(min-width:1024px) 230px, 100vw" className="object-cover" />
                  )}
                  <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[11px] font-medium text-white">
                    <Camera className="h-3 w-3" />
                    {l.images.length} photo{l.images.length === 1 ? "" : "s"}
                  </span>
                </div>

                {/* identity */}
                <div className="min-w-0 flex-1 py-1">
                  <StatusPill status={l.status} />
                  <Link href={`/host/listings/${l.slug}/edit`} className="mt-2 block">
                    <h2 className="font-display text-[22px] leading-snug hover:underline sm:text-2xl">{l.name}</h2>
                  </Link>
                  {l.reviewCount > 0 && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{l.rating}</span>
                      <span className="text-muted-foreground">({l.reviewCount} reviews)</span>
                    </p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span>{TYPE_LABEL[l.type ?? "villa"]}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {[l.city, l.state].filter(Boolean).join(", ") || l.locationNote}
                    </span>
                  </p>
                  <p className="mt-3 text-[15px]">
                    <span className="font-semibold">{formatINR(l.pricePerNight)}</span>
                    <span className="text-muted-foreground"> / night</span>
                  </p>
                  <p className="mt-1.5 text-[13px] text-muted-foreground">Direct · Earthy Stays</p>
                  {l.status === "rejected" && l.rejectedReason && (
                    <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
                      Reviewer note: {l.rejectedReason}
                    </p>
                  )}
                </div>

                {/* metrics */}
                <div className="grid shrink-0 grid-cols-3 gap-6 border-t border-border/60 pt-4 lg:w-[330px] lg:border-l lg:border-t-0 lg:pl-6 lg:pt-1">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{cur.occ}%</p>
                    <p className="text-[13px] text-muted-foreground">Occupancy</p>
                    <Delta now={cur.occ} before={before.occ} invertZero />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{formatINRCompact(cur.revenue)}</p>
                    <p className="text-[13px] text-muted-foreground">Revenue (month)</p>
                    <Delta now={cur.revenue} before={before.revenue} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">{cur.count}</p>
                    <p className="text-[13px] text-muted-foreground">Bookings</p>
                    <Delta now={cur.count} before={before.count} />
                  </div>
                </div>

                {/* manage rail */}
                <div className="flex shrink-0 flex-row items-center gap-2 border-t border-border/60 pt-4 lg:w-[170px] lg:flex-col lg:items-stretch lg:border-l lg:border-t-0 lg:pl-5 lg:pt-1">
                  <Link
                    href={`/host/listings/${l.slug}/edit`}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-primary/10 px-4 py-2 text-sm font-semibold text-foreground hover:bg-primary/15 lg:flex-none"
                  >
                    Manage <ChevronRight className="h-4 w-4" />
                  </Link>
                  <div className="hidden flex-col gap-0.5 lg:flex">
                    <Link href={`/host/calendar?listing=${l.slug}`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      <CalendarDays className="h-4 w-4" /> Calendar
                    </Link>
                    <Link href={`/host/listings/${l.slug}/edit`} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      <Tag className="h-4 w-4" /> Pricing
                    </Link>
                    <Link href="/host/performance" className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] text-muted-foreground hover:bg-muted/50 hover:text-foreground">
                      <BarChart3 className="h-4 w-4" /> Analytics
                    </Link>
                  </div>
                  <div className="lg:px-1">
                    <ListingRowActions slug={l.slug} status={l.status} />
                  </div>
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-center text-sm text-muted-foreground">
            Showing 1 to {listings.length} of {listings.length} listing{listings.length === 1 ? "" : "s"}
          </p>
        </div>
      )}
    </div>
  );
}
