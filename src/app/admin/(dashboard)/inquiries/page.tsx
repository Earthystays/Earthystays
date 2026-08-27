import Link from "next/link";
import Image from "next/image";
import { readJson } from "@/lib/storage";
import type {
  StoredInquiry,
  InquiryStatus,
} from "@/app/api/inquiries/route";
import {
  Inbox,
  Search,
  Download,
  X,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import { StatusControl } from "./status-control";
import { InquirySearch } from "./inquiry-search";
import { getVillaBySlug } from "@/lib/data/villas";
import { getExperienceBySlug } from "@/lib/data/experiences";

export const dynamic = "force-dynamic";
export const metadata = { title: "Inquiries · Admin" };

type CanonicalStatus =
  | "new"
  | "open"
  | "quote-sent"
  | "negotiating"
  | "booked"
  | "lost";

type Source =
  | "website"
  | "whatsapp"
  | "instagram"
  | "partner"
  | "referral"
  | "concierge";

const STATUS_ORDER: CanonicalStatus[] = [
  "new",
  "open",
  "quote-sent",
  "negotiating",
  "booked",
  "lost",
];

const STATUS_LABEL: Record<CanonicalStatus, string> = {
  new: "New",
  open: "Open",
  "quote-sent": "Quote Sent",
  negotiating: "Negotiating",
  booked: "Booked",
  lost: "Lost",
};

/** Dot colour per status — the single source of colour in the list. */
const STATUS_DOT: Record<CanonicalStatus, string> = {
  new: "bg-[#B84A45]",
  open: "bg-[#B36B1E]",
  "quote-sent": "bg-[#6B5091]",
  negotiating: "bg-[#D9855A]",
  booked: "bg-[#3E6B4C]",
  lost: "bg-[#8A6B5F]",
};

const STATUS_PILL: Record<CanonicalStatus, string> = {
  new: "bg-[#F6D8D4] text-[#B84A45]",
  open: "bg-[#F5E3CC] text-[#B36B1E]",
  "quote-sent": "bg-[#EDE5F7] text-[#6B5091]",
  negotiating: "bg-[#F9DAC8] text-[#D9855A]",
  booked: "bg-[#D8E9DD] text-[#3E6B4C]",
  lost: "bg-[#E5D5CD] text-[#8A6B5F]",
};

const SOURCE_LABEL: Record<Source, string> = {
  website: "Website",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  partner: "Partner",
  referral: "Referral",
  concierge: "Concierge",
};

const SOURCES: Source[] = [
  "website",
  "whatsapp",
  "instagram",
  "partner",
  "referral",
  "concierge",
];

// ── Helpers ────────────────────────────────────────────────────────────────

function normalizeStatus(s?: InquiryStatus): CanonicalStatus {
  const status = s ?? "new";
  if (status === "shared") return "quote-sent";
  if (status === "closed") return "booked";
  return status as CanonicalStatus;
}

function deriveSource(q: StoredInquiry): Source {
  const k = q.kind ?? "guest";
  if (k === "callback") return "whatsapp";
  if (k === "partner") return "partner";
  if (k === "experience") return "concierge";
  return "website";
}

function initials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("") || "?"
  );
}

function avatarBg(seed: string): string {
  const palette = [
    "bg-[#E4EAD9] text-[#5D7050]",
    "bg-[#F5E3D1] text-[#B87850]",
    "bg-[#EDE5F7] text-[#6B5091]",
    "bg-[#F9DAC8] text-[#D9855A]",
    "bg-[#D8E9DD] text-[#3E6B4C]",
    "bg-[#F6D8D4] text-[#B84A45]",
  ];
  let n = 0;
  for (let i = 0; i < seed.length; i++)
    n = (n + seed.charCodeAt(i)) % palette.length;
  return palette[n];
}

const DATE_SHORT = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
});
const DATE_LONG = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const TIME_LONG = new Intl.DateTimeFormat("en-IN", {
  hour: "2-digit",
  minute: "2-digit",
});

function nightsBetween(a?: string, b?: string): number {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / (24 * 60 * 60 * 1000)));
}

function formatDates(q: StoredInquiry): string {
  if (!q.checkIn && !q.checkOut) return "Flexible dates";
  const from = q.checkIn ? DATE_SHORT.format(new Date(q.checkIn)) : "?";
  const to = q.checkOut ? DATE_SHORT.format(new Date(q.checkOut)) : "?";
  return `${from} – ${to}`;
}

/** "11 adults, 2 children, 4 rooms" — compact, skips empty parts. */
function formatParty(q: StoredInquiry): string {
  const adults = q.adults ?? q.guests ?? 0;
  const parts: string[] = [];
  if (adults > 0) parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
  if ((q.children ?? 0) > 0)
    parts.push(`${q.children} child${q.children === 1 ? "" : "ren"}`);
  if ((q.rooms ?? 0) > 0)
    parts.push(`${q.rooms} room${q.rooms === 1 ? "" : "s"}`);
  return parts.join(", ") || "—";
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const mins = Math.max(1, Math.round((Date.now() - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

// ── Page ───────────────────────────────────────────────────────────────────

type SearchParams = Promise<{
  status?: string;
  source?: string;
  kind?: string; // legacy — treated as source
  id?: string;
}>;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;

  const statusFilter: CanonicalStatus | undefined =
    sp.status && (STATUS_ORDER as string[]).includes(sp.status)
      ? (sp.status as CanonicalStatus)
      : undefined;

  // Backward-compat: the sidebar's Concierge link uses ?kind=experience.
  const sourceFromKind: Source | undefined =
    sp.kind === "experience"
      ? "concierge"
      : sp.kind === "callback"
        ? "whatsapp"
        : sp.kind === "partner"
          ? "partner"
          : sp.kind === "guest"
            ? "website"
            : undefined;
  const sourceRaw = sp.source ?? sourceFromKind;
  const sourceFilter: Source | undefined =
    sourceRaw && (SOURCES as string[]).includes(sourceRaw)
      ? (sourceRaw as Source)
      : undefined;

  const selectedId = sp.id;

  const all = await readJson<StoredInquiry[]>("inquiries.json", []);
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const enriched = all.map((q) => ({
    q,
    normalized: normalizeStatus(q.status),
    source: deriveSource(q),
    lastFollowUp: q.updatedAt ?? q.createdAt,
  }));

  const visible = enriched.filter((e) => {
    if (statusFilter && e.normalized !== statusFilter) return false;
    if (sourceFilter && e.source !== sourceFilter) return false;
    return true;
  });

  const isConciergeView = sourceFilter === "concierge";

  const countFor = (s: CanonicalStatus) =>
    enriched.filter((e) => e.normalized === s).length;

  const newCount = countFor("new");

  /** Build a URL preserving the other active filter. */
  const filterHref = (patch: { status?: string; source?: string }) => {
    const p = new URLSearchParams();
    const status = "status" in patch ? patch.status : statusFilter;
    const source = "source" in patch ? patch.source : sourceFilter;
    if (status) p.set("status", status);
    if (source) p.set("source", source);
    const qs = p.toString();
    return `/admin/inquiries${qs ? `?${qs}` : ""}`;
  };

  const selected = selectedId
    ? enriched.find((e) => e.q.id === selectedId)
    : undefined;

  return (
    <div>
      {/* HEADER */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="admin-page-title">
            {isConciergeView ? "Concierge Requests" : "Inquiries"}
          </h1>
          <p className="admin-subtitle mt-3">
            <span className="admin-numeric font-semibold text-[#23211C]">
              {enriched.length}
            </span>{" "}
            total
            {newCount > 0 && (
              <>
                {" · "}
                <span className="admin-numeric font-semibold text-[#B84A45]">
                  {newCount}
                </span>{" "}
                awaiting first reply
              </>
            )}
          </p>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <InquirySearch />
          <Link
            href="/api/admin/inquiries/export"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[hsl(38_18%_88%)] bg-white px-3 py-2 text-xs font-medium text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Link>
        </div>
      </header>

      {/* ONE filter row: status + count. Replaces the old KPI card band
          and the duplicate pill row that sat directly beneath it. */}
      <div className="mt-7 flex flex-wrap items-center gap-2">
        <FilterTab
          label="All"
          count={enriched.length}
          href={filterHref({ status: undefined })}
          active={!statusFilter}
        />
        {STATUS_ORDER.map((s) => (
          <FilterTab
            key={s}
            label={STATUS_LABEL[s]}
            count={countFor(s)}
            dot={STATUS_DOT[s]}
            href={filterHref({ status: s })}
            active={statusFilter === s}
          />
        ))}
      </div>

      {/* Source — secondary, visually quieter than status. */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#A79E8E]">
          Source
        </span>
        <SourceLink
          label="All"
          href={filterHref({ source: undefined })}
          active={!sourceFilter}
        />
        {SOURCES.map((s) => (
          <SourceLink
            key={s}
            label={SOURCE_LABEL[s]}
            href={filterHref({ source: s })}
            active={sourceFilter === s}
          />
        ))}
      </div>

      {/* LIST + DETAIL */}
      <div
        className={`mt-5 grid gap-5 ${selected ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}
      >
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[hsl(38_18%_88%)] bg-white">
          {visible.length === 0 ? (
            <EmptyState
              message={
                enriched.length === 0
                  ? "No inquiries yet — new leads will land here."
                  : "Nothing matches this filter."
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="whitespace-nowrap border-b border-[hsl(38_18%_92%)] text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#857B6C]">
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Stay</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e) => {
                    const villa = e.q.villa
                      ? getVillaBySlug(e.q.villa)
                      : undefined;
                    const experience = e.q.experience
                      ? getExperienceBySlug(e.q.experience)
                      : undefined;
                    const nights = nightsBetween(e.q.checkIn, e.q.checkOut);
                    const isSelected = selected?.q.id === e.q.id;
                    const rowHref = `/admin/inquiries?${new URLSearchParams({
                      ...(statusFilter ? { status: statusFilter } : {}),
                      ...(sourceFilter ? { source: sourceFilter } : {}),
                      id: e.q.id,
                    }).toString()}`;
                    const title =
                      villa?.name ??
                      experience?.name ??
                      e.q.villa ??
                      e.q.experience ??
                      "—";
                    const place = experience
                      ? [experience.city, experience.state]
                          .filter(Boolean)
                          .join(", ")
                      : [villa?.city, villa?.state].filter(Boolean).join(", ");
                    const haystack = [
                      e.q.name,
                      e.q.phone,
                      e.q.email,
                      title,
                      place,
                      SOURCE_LABEL[e.source],
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();

                    return (
                      <tr
                        key={e.q.id}
                        data-search={haystack}
                        className={`border-b border-[hsl(38_18%_94%)] transition-colors last:border-0 ${
                          isSelected
                            ? "bg-[hsl(85_25%_95%)]"
                            : "hover:bg-[hsl(38_30%_97%)]"
                        }`}
                      >
                        {/* Guest — name, phone, and source as plain text
                            instead of an unlabelled coloured icon. */}
                        <td className="px-4 py-3">
                          <Link
                            href={rowHref}
                            className="flex items-center gap-2.5"
                          >
                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarBg(e.q.name)}`}
                            >
                              {initials(e.q.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#2A2A2A]">
                                {e.q.name}
                              </p>
                              <p className="admin-numeric truncate text-[11px] text-[#8A8072]">
                                {e.q.phone}
                                <span className="text-[#C4BCAD]"> · </span>
                                {SOURCE_LABEL[e.source]}
                              </p>
                            </div>
                          </Link>
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={rowHref}
                            className="flex items-center gap-2.5"
                          >
                            <div className="relative h-9 w-11 shrink-0 overflow-hidden rounded-md bg-[hsl(38_30%_93%)]">
                              {(villa?.images[0]?.src ??
                                experience?.image.src) && (
                                <Image
                                  src={
                                    (villa?.images[0]?.src ??
                                      experience?.image.src)!
                                  }
                                  alt=""
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[#2A2A2A]">
                                {title}
                              </p>
                              <p className="truncate text-[11px] text-[#8A8072]">
                                {place || "—"}
                              </p>
                            </div>
                          </Link>
                        </td>

                        {/* Stay — dates and party merged into one column. */}
                        <td className="px-4 py-3">
                          <Link href={rowHref} className="block">
                            <p className="admin-numeric whitespace-nowrap text-[13px] text-[#4A4235]">
                              {formatDates(e.q)}
                              {nights > 0 && (
                                <span className="text-[#8A8072]">
                                  {" "}
                                  · {nights}n
                                </span>
                              )}
                            </p>
                            <p className="truncate text-[11px] text-[#8A8072]">
                              {formatParty(e.q)}
                            </p>
                          </Link>
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_PILL[e.normalized]}`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[e.normalized]}`}
                            />
                            {STATUS_LABEL[e.normalized]}
                          </span>
                        </td>

                        <td className="px-4 py-3">
                          <Link
                            href={rowHref}
                            className="flex items-center justify-end gap-1.5 whitespace-nowrap text-[11px] text-[#8A8072]"
                          >
                            {relativeTime(e.lastFollowUp)}
                            <ChevronRight className="h-4 w-4 text-[#C4BCAD]" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div id="inquiry-search-empty" hidden>
                <EmptyState message="No inquiries match your search." search />
              </div>
            </div>
          )}
        </section>

        {selected && (
          <DetailPanel
            entry={selected}
            statusFilter={statusFilter}
            sourceFilter={sourceFilter}
          />
        )}
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function EmptyState({
  message,
  search,
}: {
  message: string;
  search?: boolean;
}) {
  const Icon = search ? Search : Inbox;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <Icon className="h-8 w-8 text-[#8A8072]" strokeWidth={1.5} />
      <p className="text-sm text-[#8A8072]">{message}</p>
    </div>
  );
}

/** Primary filter: status + live count. */
function FilterTab({
  label,
  count,
  href,
  active,
  dot,
}: {
  label: string;
  count: number;
  href: string;
  active: boolean;
  dot?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs transition-colors ${
        active
          ? "bg-[#2A2A2A] text-white"
          : "border border-[hsl(38_18%_88%)] bg-white text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
      }`}
    >
      {dot && (
        <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
      )}
      {label}
      <span
        className={`admin-numeric text-[11px] font-semibold ${
          active ? "text-white/70" : "text-[#A79E8E]"
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

/** Secondary filter: source. Quieter than FilterTab by design. */
function SourceLink({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 text-[11px] transition-colors ${
        active
          ? "bg-[hsl(38_30%_90%)] font-medium text-[#3A342A]"
          : "text-[#8A8072] hover:bg-[hsl(38_30%_95%)]"
      }`}
    >
      {label}
    </Link>
  );
}

function DetailPanel({
  entry,
  statusFilter,
  sourceFilter,
}: {
  entry: {
    q: StoredInquiry;
    normalized: CanonicalStatus;
    source: Source;
    lastFollowUp: string;
  };
  statusFilter?: CanonicalStatus;
  sourceFilter?: Source;
}) {
  const { q, normalized, source, lastFollowUp } = entry;
  const villa = q.villa ? getVillaBySlug(q.villa) : undefined;
  const experience = q.experience ? getExperienceBySlug(q.experience) : undefined;
  const nights = nightsBetween(q.checkIn, q.checkOut);
  const closeHref = `/admin/inquiries?${new URLSearchParams({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sourceFilter ? { source: sourceFilter } : {}),
  }).toString()}`;
  const waHref = `https://wa.me/${q.phone.replace(/\D/g, "")}`;

  return (
    <aside className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-start justify-between gap-3 border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${avatarBg(q.name)}`}
          >
            {initials(q.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#2A2A2A]">
              {q.name}
            </p>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[normalized]}`}
            >
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_DOT[normalized]}`}
              />
              {STATUS_LABEL[normalized]}
            </span>
          </div>
        </div>
        <Link
          href={closeHref}
          aria-label="Close details"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[#8A8072] hover:bg-[hsl(38_30%_93%)]"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      {/* Reach the guest — the panel's primary job. */}
      <div className="grid grid-cols-3 gap-2 border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <ActionBtn
          href={waHref}
          bg="bg-[#D8E9DD]"
          tone="text-[#3E6B4C]"
          label="WhatsApp"
          icon={
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
            </svg>
          }
        />
        <ActionBtn
          href={`tel:${q.phone}`}
          bg="bg-[#F9DAC8]"
          tone="text-[#D9855A]"
          label="Call"
          icon={<Phone className="h-4 w-4" />}
        />
        <ActionBtn
          href={q.email ? `mailto:${q.email}` : undefined}
          bg="bg-[#EDE5F7]"
          tone="text-[#6B5091]"
          label="Email"
          icon={<Mail className="h-4 w-4" />}
        />
      </div>

      {/* The guest's own words — previously not shown anywhere. */}
      {q.message && (
        <div className="border-b border-[hsl(38_18%_92%)] px-5 py-4">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-[#2A2A2A]">
            <MessageSquare className="h-3.5 w-3.5 text-[#8A8072]" />
            Guest message
          </p>
          <p className="whitespace-pre-wrap rounded-lg bg-[hsl(38_30%_97%)] px-3 py-2.5 text-xs leading-relaxed text-[#4A4235]">
            {q.message}
          </p>
        </div>
      )}

      <div className="border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <dl className="space-y-2 text-xs">
          <DetailRow
            label="Property"
            value={villa?.name ?? experience?.name ?? q.villa ?? q.experience ?? "—"}
          />
          <DetailRow
            label="Location"
            value={
              (experience
                ? [experience.city, experience.state]
                : [villa?.city, villa?.state]
              )
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          <DetailRow
            label="Dates"
            value={
              q.checkIn && q.checkOut
                ? `${DATE_LONG.format(new Date(q.checkIn))} – ${DATE_LONG.format(new Date(q.checkOut))}${nights > 0 ? ` (${nights} night${nights === 1 ? "" : "s"})` : ""}`
                : "Flexible"
            }
          />
          <DetailRow label="Guests" value={formatParty(q)} />
          {q.bookingItems && q.bookingItems.length > 0 && (
            <DetailRow
              label={
                q.bookingItems.some((it) => it.selectedInventoryIds?.length)
                  ? "Beds"
                  : "Rooms"
              }
              value={
                <span className="grid gap-0.5">
                  {q.bookingItems.map((it, i) => (
                    <span key={i}>
                      {it.quantity}× {it.unitName}
                      {it.unitPrice != null
                        ? ` @ ₹${it.unitPrice.toLocaleString("en-IN")}/night`
                        : ""}
                    </span>
                  ))}
                </span>
              }
            />
          )}
          <DetailRow label="Source" value={SOURCE_LABEL[source]} />
          <DetailRow label="Contact" value={q.email ?? q.phone} />
          <DetailRow
            label="Received"
            value={`${DATE_LONG.format(new Date(q.createdAt))}, ${TIME_LONG.format(new Date(q.createdAt))}`}
          />
          <DetailRow label="Last update" value={relativeTime(lastFollowUp)} />
        </dl>
      </div>

      <div className="px-5 py-4">
        <p className="mb-2 text-xs font-semibold text-[#2A2A2A]">
          Status &amp; internal note
        </p>
        <StatusControl
          id={q.id}
          initialStatus={q.status ?? "new"}
          initialNote={q.note ?? ""}
        />
      </div>
    </aside>
  );
}

function ActionBtn({
  href,
  bg,
  tone,
  label,
  icon,
}: {
  href?: string;
  bg: string;
  tone: string;
  label: string;
  icon: React.ReactNode;
}) {
  if (!href) {
    return (
      <div
        className={`inline-flex flex-col items-center justify-center gap-1 rounded-lg py-2 opacity-40 ${bg} ${tone}`}
        title="No email on this inquiry"
      >
        {icon}
        <span className="text-[10px] font-medium">{label}</span>
      </div>
    );
  }
  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      className={`inline-flex flex-col items-center justify-center gap-1 rounded-lg py-2 transition-opacity hover:opacity-80 ${bg} ${tone}`}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
    </a>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-[#8A8072]">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-[#2A2A2A]">{value}</dd>
    </div>
  );
}
