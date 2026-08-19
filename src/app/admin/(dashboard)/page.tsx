import Link from "next/link";
import Image from "next/image";
import {
  Inbox,
  Home as HomeIcon,
  Star,
  BellRing,
  MoreVertical,
} from "lucide-react";
import { DateRangeFilter } from "./date-range-filter";
import { getVillasWithHidden } from "@/lib/data/villas";
import { getReviews } from "@/lib/data/reviews";
import { getRecentViewCountsSync } from "@/lib/data/villa-views";
import { computeWhatsAppMetrics } from "@/lib/data/whatsapp-clicks";
import { readJson } from "@/lib/storage";
import type { StoredInquiry, InquiryStatus } from "@/app/api/inquiries/route";

export const dynamic = "force-dynamic";

function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
    </svg>
  );
}

const MONTH_SHORT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
});
const YEAR_FMT = new Intl.DateTimeFormat("en-IN", { year: "numeric" });

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(1, Math.round((now - then) / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function formatDates(a?: string, b?: string): string {
  if (!a && !b) return "Flexible";
  const from = a ? MONTH_SHORT.format(new Date(a)) : "?";
  const to = b ? MONTH_SHORT.format(new Date(b)) : "?";
  return `${from} – ${to}`;
}

function guestsLabel(q: StoredInquiry): string {
  const adults = q.adults ?? q.guests ?? 0;
  const children = q.children ?? 0;
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} Adult${adults === 1 ? "" : "s"}`);
  if (children > 0) parts.push(`${children} Child${children === 1 ? "" : "ren"}`);
  return parts.join("\n") || "—";
}

/**
 * Reads a stored inquiry's status and returns its display pill.
 * Legacy values (`shared`/`closed`) map to the new six-step pipeline so
 * older rows still render cleanly. New values (Quote Sent / Negotiating /
 * Booked / Lost) all get their own tinted pill.
 */
function displayStatus(q: StoredInquiry): { label: string; cls: string } {
  const raw = (q.status ?? "new") as InquiryStatus;
  const s = raw === "shared" ? "quote-sent" : raw === "closed" ? "booked" : raw;
  switch (s) {
    case "new":
      return { label: "New", cls: "bg-[#F6D8D4] text-[#B84A45]" };
    case "open":
      return { label: "Open", cls: "bg-[#F5E3CC] text-[#B36B1E]" };
    case "quote-sent":
      return { label: "Quote Sent", cls: "bg-[#EDE5F7] text-[#6B5091]" };
    case "negotiating":
      return { label: "Negotiating", cls: "bg-[#F9DAC8] text-[#D9855A]" };
    case "booked":
      return { label: "Booked", cls: "bg-[#D8E9DD] text-[#3E6B4C]" };
    case "lost":
      return { label: "Lost", cls: "bg-[#E5D5CD] text-[#8A6B5F]" };
    default:
      return { label: "New", cls: "bg-[#F6D8D4] text-[#B84A45]" };
  }
}

/**
 * Extracts a clean, human-readable title from an inquiry message.
 * Concierge/experience inquiries follow the pattern
 * `"Experience: <Name> (<slug>)"` — strip the `Experience:` prefix and
 * the trailing slug so the panel reads "Yacht Charter" not
 * "Experience: Yacht Charter (yacht-cha...".
 */
function extractInquiryTitle(message?: string): string {
  const raw = (message ?? "").trim();
  if (!raw) return "Experience request";
  const first = raw.split("\n")[0];
  const m = first.match(/^Experience:\s*(.+?)\s*(?:\(.+\))?\s*$/i);
  if (m) return m[1].trim();
  return first.length > 60 ? first.slice(0, 57) + "…" : first;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function avatarBg(seed: string): string {
  const palette = [
    "bg-[#E4EAD9] text-[#5D7050]",
    "bg-[#F5E3D1] text-[#B87850]",
    "bg-[#EDE5F7] text-[#6B5091]",
    "bg-[#F9DAC8] text-[#D9855A]",
    "bg-[#D8E9DD] text-[#3E6B4C]",
  ];
  let n = 0;
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % palette.length;
  return palette[n];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Resolves the `?range=` search params into a concrete window.
 * `range=7|15|30` → trailing N days; `range=custom&from&to` → the given
 * dates (whole days, inclusive); anything else → the current calendar
 * month. `footnote` is the short label shown under KPI cards and section
 * headings so every widget states which window it's reporting on.
 */
function resolveRange(sp: Record<string, string | undefined>): {
  range: string;
  start: number;
  end: number;
  footnote: string;
  from?: string;
  to?: string;
} {
  const now = new Date();
  if (sp.range === "7" || sp.range === "15" || sp.range === "30") {
    const days = Number(sp.range);
    return {
      range: sp.range,
      start: now.getTime() - (days - 1) * DAY_MS,
      end: now.getTime(),
      footnote: `Last ${days} days`,
    };
  }
  if (sp.range === "custom" && sp.from && sp.to) {
    const from = new Date(`${sp.from}T00:00:00`);
    const to = new Date(`${sp.to}T23:59:59.999`);
    if (!isNaN(from.getTime()) && !isNaN(to.getTime()) && from <= to) {
      return {
        range: "custom",
        start: from.getTime(),
        end: to.getTime(),
        footnote: `${MONTH_SHORT.format(from)} – ${MONTH_SHORT.format(to)}`,
        from: sp.from,
        to: sp.to,
      };
    }
  }
  return {
    range: "month",
    start: new Date(now.getFullYear(), now.getMonth(), 1).getTime(),
    end: now.getTime(),
    footnote: "This month",
  };
}

export default async function AdminOverviewPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { range, start, end, footnote, from, to } = resolveRange(sp);
  const inRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= start && t <= end;
  };
  // Equal-length window immediately before the selected one — the
  // baseline for the ↑/↓ deltas on the KPI cards.
  const prevStart = start - (end - start);
  const inPrevRange = (iso: string) => {
    const t = new Date(iso).getTime();
    return t >= prevStart && t < start;
  };

  const villas = getVillasWithHidden();
  const inquiries = await readJson<StoredInquiry[]>("inquiries.json", []);
  const reviews = getReviews();
  const viewsByVilla = getRecentViewCountsSync({ start, end });

  const inquiriesInRange = inquiries.filter((q) => inRange(q.createdAt));
  const inquiriesPrev = inquiries.filter((q) => inPrevRange(q.createdAt)).length;
  const inquiryDelta =
    inquiriesPrev === 0
      ? null
      : Math.round(
          ((inquiriesInRange.length - inquiriesPrev) / inquiriesPrev) * 100,
        );

  const activeProperties = villas.length;
  const reviewsInRange = reviews.filter((r) => inRange(r.createdAt)).length;
  const pendingReviews = reviews.filter((r) => r.active === false).length;

  const conciergeAll = inquiries.filter((q) => q.kind === "experience");
  const conciergeInRange = conciergeAll.filter((q) => inRange(q.createdAt));
  const conciergeNew = conciergeInRange.filter(
    (q) => (q.status ?? "new") === "new",
  ).length;

  // Real WhatsApp button clicks from the public site — captured by the
  // sendBeacon call attached to every WhatsApp anchor.
  const whatsappMetrics = computeWhatsAppMetrics({ start, end });
  const whatsappLeads = whatsappMetrics.inRange;
  const whatsappDelta = whatsappMetrics.delta;

  const recent = inquiriesInRange
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  // Only surface concierge requests that still need attention. Closed /
  // Booked / Lost items are done work — no reason to clutter the "needs
  // attention" panel with them. If everything's closed, we fall back to
  // showing the most recent regardless so the panel doesn't feel empty
  // just because the team worked through the backlog.
  const openConcierge = conciergeAll
    .filter((q) => {
      const s = q.status ?? "new";
      return s !== "closed" && s !== "booked" && s !== "lost";
    })
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  const concierge = (
    openConcierge.length > 0
      ? openConcierge
      : [...conciergeAll].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  ).slice(0, 4);

  const performance = villas
    .map((v) => {
      const views = viewsByVilla[v.slug] ?? 0;
      const inqs = inquiriesInRange.filter((q) => q.villa === v.slug).length;
      const rate = views > 0 ? (inqs / views) * 100 : 0;
      return {
        slug: v.slug,
        name: v.name,
        city: v.city,
        state: v.state,
        cover: v.images[0]?.src,
        views,
        inqs,
        rate,
        waClicks: whatsappMetrics.byVilla[v.slug] ?? 0,
      };
    })
    .sort((a, b) => b.inqs - a.inqs || b.views - a.views)
    .slice(0, 3);

  const pipeline = {
    new: inquiriesInRange.filter((q) => (q.status ?? "new") === "new").length,
    contacted: inquiriesInRange.filter((q) => q.status === "open").length,
    quotation: inquiriesInRange.filter((q) => q.status === "shared").length,
    followUp: 0,
    closed: inquiriesInRange.filter((q) => q.status === "closed").length,
  };
  const pipelineTotal =
    pipeline.new +
    pipeline.contacted +
    pipeline.quotation +
    pipeline.followUp +
    pipeline.closed;

  const dateRangeLabel = `${MONTH_SHORT.format(new Date(start))} – ${MONTH_SHORT.format(
    new Date(end),
  )}, ${YEAR_FMT.format(new Date(end))}`;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title">
            Good morning, Admin <span className="inline-block">👋</span>
          </h1>
          <p className="admin-subtitle mt-3">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <DateRangeFilter
          range={range}
          from={from}
          to={to}
          label={dateRangeLabel}
        />
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          icon={<Inbox className="h-5 w-5" />}
          iconBg="bg-[#E4EAD9]"
          iconTone="text-[#5D7050]"
          label="New Inquiries"
          value={inquiriesInRange.length}
          delta={inquiryDelta}
          deltaLabel="vs previous period"
          footnote={footnote}
        />
        <KpiCard
          icon={<HomeIcon className="h-5 w-5" />}
          iconBg="bg-[#F5E3D1]"
          iconTone="text-[#B87850]"
          label="Active Properties"
          value={activeProperties}
          sub="Villas & Apartments"
          footnote="Published"
        />
        <KpiCard
          icon={<Star className="h-5 w-5" />}
          iconBg="bg-[#EDE5F7]"
          iconTone="text-[#6B5091]"
          label="New Reviews"
          value={reviewsInRange}
          sub={
            pendingReviews > 0
              ? `${pendingReviews} pending approval`
              : "All approved"
          }
          subTone="text-[#B36B1E]"
          footnote={footnote}
        />
        <KpiCard
          icon={<BellRing className="h-5 w-5" />}
          iconBg="bg-[#F9DAC8]"
          iconTone="text-[#D9855A]"
          label="Concierge Requests"
          value={conciergeInRange.length}
          sub={`${conciergeNew} new requests`}
          subTone="text-[#D9855A]"
          footnote={footnote}
        />
        <KpiCard
          icon={<WhatsAppGlyph className="h-5 w-5" />}
          iconBg="bg-[#D8E9DD]"
          iconTone="text-[#3E6B4C]"
          label="WhatsApp Leads"
          value={whatsappLeads}
          delta={whatsappDelta}
          deltaLabel="vs previous period"
          footnote={footnote}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-[#2A2A2A]">
              Recent Inquiries
            </h2>
            <Link
              href="/admin/inquiries"
              className="rounded-full border border-[hsl(38_18%_88%)] px-3 py-1.5 text-xs font-medium text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
            >
              View all
            </Link>
          </div>

          {recent.length === 0 ? (
            <p className="mt-8 py-10 text-center text-sm text-[#8A8072]">
              No inquiries in this period — adjust the date range or check
              back later.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[#8A8072]">
                    <th className="pb-3 pr-4 font-medium">Guest</th>
                    <th className="pb-3 pr-4 font-medium">Property</th>
                    <th className="pb-3 pr-4 font-medium">Guests</th>
                    <th className="pb-3 pr-4 font-medium">Dates</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 pr-4 font-medium">Received</th>
                    <th className="pb-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {recent.map((q) => {
                    const villa = villas.find((v) => v.slug === q.villa);
                    const status = displayStatus(q);
                    return (
                      <tr key={q.id} className="border-t border-[hsl(38_18%_92%)]">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`grid h-9 w-9 place-items-center rounded-full text-xs font-semibold ${avatarBg(q.name)}`}
                            >
                              {initials(q.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#2A2A2A]">
                                {q.name}
                              </p>
                              {q.email && (
                                <p className="truncate text-[11px] text-[#8A8072]">
                                  {q.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-[#4A4235]">
                          <p className="font-medium">
                            {villa?.name ?? q.villa ?? "—"}
                          </p>
                          {(villa?.city || villa?.state) && (
                            <p className="text-[11px] text-[#8A8072]">
                              {[villa?.city, villa?.state].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4 whitespace-pre-line text-[#4A4235]">
                          {guestsLabel(q)}
                        </td>
                        <td className="py-3 pr-4 text-[#4A4235]">
                          {formatDates(q.checkIn, q.checkOut)}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${status.cls}`}
                          >
                            {status.label}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-[11px] text-[#8A8072]">
                          {relativeTime(q.createdAt)}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            className="grid h-7 w-7 place-items-center rounded-full text-[#8A8072] hover:bg-[hsl(38_30%_93%)]"
                            aria-label="More"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-[#2A2A2A]">
              Concierge Requests
            </h2>
            <Link
              href="/admin/inquiries?kind=experience"
              className="rounded-full border border-[hsl(38_18%_88%)] px-3 py-1.5 text-xs font-medium text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
            >
              View all
            </Link>
          </div>
          {concierge.length === 0 ? (
            <p className="mt-8 py-10 text-center text-sm text-[#8A8072]">
              No concierge requests yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {concierge.map((q) => {
                const villa = villas.find((v) => v.slug === q.villa);
                const cover = villa?.images[0]?.src;
                const status = displayStatus(q);
                const title = extractInquiryTitle(q.message);
                const subline = villa?.name
                  ? `${villa.name} · ${relativeTime(q.createdAt)}`
                  : `${q.name} · ${relativeTime(q.createdAt)}`;
                return (
                  <li
                    key={q.id}
                    className="flex items-center gap-3 rounded-xl border border-[hsl(38_18%_92%)] p-2.5"
                  >
                    <div className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F9DAC8]">
                      {cover ? (
                        <Image
                          src={cover}
                          alt=""
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      ) : (
                        <BellRing
                          className="h-6 w-6 text-[#D9855A]"
                          strokeWidth={1.6}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#2A2A2A]">
                        {title}
                      </p>
                      <p className="truncate text-[11px] text-[#8A8072]">
                        {subline}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium ${status.cls}`}
                    >
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="font-display text-lg text-[#2A2A2A]">
                Top Performing Properties
              </h2>
              <span className="text-xs text-[#8A8072]">({footnote})</span>
            </div>
            <Link
              href="/admin/villas"
              className="rounded-full border border-[hsl(38_18%_88%)] px-3 py-1.5 text-xs font-medium text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
            >
              View all
            </Link>
          </div>
          {performance.length === 0 ? (
            <p className="mt-8 py-10 text-center text-sm text-[#8A8072]">
              Data appears once your villas start getting views + inquiries.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-[#8A8072]">
                    <th className="pb-3 pr-4 font-medium">Property</th>
                    <th className="pb-3 pr-4 font-medium">Views</th>
                    <th className="pb-3 pr-4 font-medium">Inquiries</th>
                    <th className="pb-3 pr-4 font-medium">WhatsApp Clicks</th>
                    <th className="pb-3 font-medium">Inquiry Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {performance.map((p) => (
                    <tr key={p.slug} className="border-t border-[hsl(38_18%_92%)]">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[hsl(38_30%_93%)]">
                            {p.cover && (
                              <Image
                                src={p.cover}
                                alt=""
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[#2A2A2A]">
                              {p.name}
                            </p>
                            <p className="truncate text-[11px] text-[#8A8072]">
                              {[p.city, p.state].filter(Boolean).join(", ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[#4A4235]">
                        {p.views.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[#4A4235]">
                        {p.inqs}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-[#4A4235]">
                        {p.waClicks > 0 ? (
                          p.waClicks.toLocaleString("en-IN")
                        ) : (
                          <span className="text-[#8A8072]">—</span>
                        )}
                      </td>
                      <td className="py-3 tabular-nums text-[#4A4235]">
                        {p.rate.toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-[#2A2A2A]">
              Inquiry Pipeline
            </h2>
            <Link
              href="/admin/inquiries"
              className="rounded-full border border-[hsl(38_18%_88%)] px-3 py-1.5 text-xs font-medium text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
            >
              View all
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <ul className="flex-1 space-y-2.5">
              <PipelineRow color="#F0B3B0" label="New" sub="Fresh inquiries" value={pipeline.new} />
              <PipelineRow color="#B8D4C4" label="Contacted" sub="We have connected" value={pipeline.contacted} />
              <PipelineRow color="#D4CDEB" label="Quotation Sent" sub="Quote shared with guest" value={pipeline.quotation} />
              <PipelineRow color="#F5D0A6" label="Follow-up" sub="Awaiting response" value={pipeline.followUp} />
              <PipelineRow color="#B8B4AC" label="Closed" sub="Not interested / others" value={pipeline.closed} />
            </ul>
            <PipelineDonut
              segments={[
                { color: "#F0B3B0", value: pipeline.new },
                { color: "#B8D4C4", value: pipeline.contacted },
                { color: "#D4CDEB", value: pipeline.quotation },
                { color: "#F5D0A6", value: pipeline.followUp },
                { color: "#B8B4AC", value: pipeline.closed },
              ]}
              total={pipelineTotal}
              label="Total Inquiries"
              subLabel={footnote}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  iconBg,
  iconTone,
  label,
  value,
  delta,
  deltaLabel,
  sub,
  subTone = "text-[#8A8072]",
  footnote,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconTone: string;
  label: string;
  value: number;
  delta?: number | null;
  deltaLabel?: string;
  sub?: string;
  subTone?: string;
  footnote?: string;
}) {
  return (
    <div className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${iconBg} ${iconTone}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-[#8A8072]">{label}</p>
          <p className="mt-1 font-numeric text-3xl font-semibold leading-none tabular-nums text-[#2A2A2A]">
            {value.toLocaleString("en-IN")}
          </p>
        </div>
      </div>
      <div className="mt-3 min-h-[18px] text-xs">
        {delta !== undefined && delta !== null && (
          <span className={delta >= 0 ? "text-[#3E6B4C]" : "text-[#B84A45]"}>
            {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%{" "}
            <span className="text-[#8A8072]">{deltaLabel}</span>
          </span>
        )}
        {sub && <span className={subTone}>{sub}</span>}
      </div>
      {footnote && (
        <p className="mt-2 border-t border-[hsl(38_18%_92%)] pt-2 text-[11px] text-[#8A8072]">
          {footnote}
        </p>
      )}
    </div>
  );
}

function PipelineRow({
  color,
  label,
  sub,
  value,
}: {
  color: string;
  label: string;
  sub: string;
  value: number;
}) {
  return (
    <li className="flex items-center gap-3">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-[#2A2A2A]">{label}</p>
        <p className="text-[10px] text-[#8A8072]">{sub}</p>
      </div>
      <span className="rounded-md bg-[hsl(38_30%_93%)] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#4A4235]">
        {value}
      </span>
    </li>
  );
}

function PipelineDonut({
  segments,
  total,
  label,
  subLabel,
}: {
  segments: { color: string; value: number }[];
  total: number;
  label: string;
  subLabel: string;
}) {
  const size = 140;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const sum = segments.reduce((s, x) => s + x.value, 0) || 1;
  let acc = 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke="hsl(38 30% 93%)"
          strokeWidth={stroke}
          fill="none"
        />
        {segments.map((seg, i) => {
          const frac = seg.value / sum;
          const len = frac * circumference;
          const dasharray = `${len} ${circumference}`;
          const dashoffset = -acc;
          acc += len;
          if (seg.value === 0) return null;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={r}
              stroke={seg.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="butt"
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-numeric text-2xl font-semibold leading-none tabular-nums text-[#2A2A2A]">
          {total}
        </span>
        <span className="mt-1 text-[10px] font-medium text-[#4A4235]">
          {label}
        </span>
        <span className="text-[10px] text-[#8A8072]">{subLabel}</span>
      </div>
    </div>
  );
}
