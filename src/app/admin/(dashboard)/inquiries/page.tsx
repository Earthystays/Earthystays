import Link from "next/link";
import Image from "next/image";
import { readJson } from "@/lib/storage";
import type {
  StoredInquiry,
  InquiryStatus,
} from "@/app/api/inquiries/route";
import {
  Inbox,
  Circle,
  Send,
  MessageCircle,
  CheckCircle2,
  XCircle,
  Flame,
  Sun,
  Snowflake,
  Globe,
  Users,
  Handshake,
  BellRing,
  Search,
  Download,
  X,
  Phone,
  Mail,
  MoreVertical,
  Pencil,
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

type Priority = "hot" | "warm" | "cold";

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

const STATUS_ICON: Record<
  CanonicalStatus,
  { Icon: typeof Circle; bg: string; tone: string; dot: string }
> = {
  new: {
    Icon: Circle,
    bg: "bg-[#F6D8D4]",
    tone: "text-[#B84A45]",
    dot: "bg-[#B84A45]",
  },
  open: {
    Icon: Circle,
    bg: "bg-[#F5E3CC]",
    tone: "text-[#B36B1E]",
    dot: "bg-[#B36B1E]",
  },
  "quote-sent": {
    Icon: Send,
    bg: "bg-[#EDE5F7]",
    tone: "text-[#6B5091]",
    dot: "bg-[#6B5091]",
  },
  negotiating: {
    Icon: MessageCircle,
    bg: "bg-[#F9DAC8]",
    tone: "text-[#D9855A]",
    dot: "bg-[#D9855A]",
  },
  booked: {
    Icon: CheckCircle2,
    bg: "bg-[#D8E9DD]",
    tone: "text-[#3E6B4C]",
    dot: "bg-[#3E6B4C]",
  },
  lost: {
    Icon: XCircle,
    bg: "bg-[#E5D5CD]",
    tone: "text-[#8A6B5F]",
    dot: "bg-[#8A6B5F]",
  },
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

/**
 * Instagram brand mark — inlined because lucide-react removed several
 * brand icons in recent releases due to trademark policy.
 */
function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/** Which source icon to render + its brand tone. */
function SourceIcon({ source, className }: { source: Source; className?: string }) {
  if (source === "whatsapp") {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#D8E9DD] text-[#3E6B4C] ${className ?? ""}`}
        aria-label="WhatsApp"
        title="WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.198-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347M12.05 21.785h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      </span>
    );
  }
  if (source === "instagram") {
    return (
      <span
        className={`inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#EDE5F7] text-[#6B5091] ${className ?? ""}`}
        aria-label="Instagram"
        title="Instagram"
      >
        <InstagramGlyph className="h-3.5 w-3.5" />
      </span>
    );
  }
  const map: Record<
    Exclude<Source, "whatsapp" | "instagram">,
    { Icon: typeof Globe; bg: string; tone: string }
  > = {
    website: { Icon: Globe, bg: "bg-[#E5E2DD]", tone: "text-[#6B6864]" },
    partner: { Icon: Users, bg: "bg-[#F5E3D1]", tone: "text-[#B87850]" },
    referral: { Icon: Handshake, bg: "bg-[#EDE5F7]", tone: "text-[#6B5091]" },
    concierge: { Icon: BellRing, bg: "bg-[#F9DAC8]", tone: "text-[#D9855A]" },
  };
  const { Icon, bg, tone } = map[source];
  return (
    <span
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full ${bg} ${tone} ${className ?? ""}`}
      aria-label={SOURCE_LABEL[source]}
      title={SOURCE_LABEL[source]}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}

const PRIORITY_META: Record<
  Priority,
  { Icon: typeof Flame; label: string; pill: string; tone: string }
> = {
  hot: {
    Icon: Flame,
    label: "Hot",
    pill: "bg-[#F6D8D4]",
    tone: "text-[#B84A45]",
  },
  warm: {
    Icon: Sun,
    label: "Warm",
    pill: "bg-[#F5E3CC]",
    tone: "text-[#B36B1E]",
  },
  cold: {
    Icon: Snowflake,
    label: "Cold",
    pill: "bg-[#EDE5F7]",
    tone: "text-[#6B5091]",
  },
};

// ── Utility helpers ─────────────────────────────────────────────────────────

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

function derivePriority(q: StoredInquiry): Priority {
  const status = normalizeStatus(q.status);
  const ageMs = Date.now() - new Date(q.createdAt).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  if (status === "lost" || status === "booked") return "cold";
  if (status === "new" && ageMs < dayMs) return "hot";
  if (ageMs < 7 * dayMs) return "warm";
  return "cold";
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
  for (let i = 0; i < seed.length; i++) n = (n + seed.charCodeAt(i)) % palette.length;
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
  if (!q.checkIn && !q.checkOut) return "Flexible";
  const from = q.checkIn ? DATE_SHORT.format(new Date(q.checkIn)) : "?";
  const to = q.checkOut ? DATE_SHORT.format(new Date(q.checkOut)) : "?";
  return `${from} – ${to}`;
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const mins = Math.max(1, Math.round((now - then) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

// ── Page ────────────────────────────────────────────────────────────────────

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

  const statusFilterRaw = sp.status;
  const statusFilter: CanonicalStatus | undefined =
    statusFilterRaw &&
    (STATUS_ORDER as string[]).includes(statusFilterRaw)
      ? (statusFilterRaw as CanonicalStatus)
      : undefined;

  // Backward-compat: sidebar's Concierge link uses ?kind=experience.
  // Map it into the new ?source= schema so the SOURCE row highlights
  // "Concierge" and the filter still narrows the list.
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
  const sourceFilterRaw = sp.source ?? sourceFromKind;
  const sourceFilter: Source | undefined =
    sourceFilterRaw &&
    (
      ["website", "whatsapp", "instagram", "partner", "referral", "concierge"] as string[]
    ).includes(sourceFilterRaw)
      ? (sourceFilterRaw as Source)
      : undefined;

  const selectedId = sp.id;

  // Load + enrich
  const all = await readJson<StoredInquiry[]>("inquiries.json", []);
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const enriched = all.map((q) => ({
    q,
    normalized: normalizeStatus(q.status),
    source: deriveSource(q),
    priority: derivePriority(q),
    lastFollowUp: q.updatedAt ?? q.createdAt,
  }));

  const visible = enriched.filter((e) => {
    if (statusFilter && e.normalized !== statusFilter) return false;
    if (sourceFilter && e.source !== sourceFilter) return false;
    return true;
  });

  // Header context: when Concierge source is active, the sidebar
  // considers this a Concierge Requests view.
  const isConciergeView = sourceFilter === "concierge";

  // KPI counts across the full dataset (independent of active filter)
  const counts = {
    all: enriched.length,
    new: enriched.filter((e) => e.normalized === "new").length,
    open: enriched.filter((e) => e.normalized === "open").length,
    "quote-sent": enriched.filter((e) => e.normalized === "quote-sent").length,
    negotiating: enriched.filter((e) => e.normalized === "negotiating").length,
    booked: enriched.filter((e) => e.normalized === "booked").length,
    lost: enriched.filter((e) => e.normalized === "lost").length,
  };

  const pct = (n: number) =>
    counts.all === 0 ? 0 : Math.round((n / counts.all) * 1000) / 10;

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
            <span className="admin-numeric font-semibold text-[#23211C]">{enriched.length}</span>{" "}
            {enriched.length === 1 ? "inquiry" : "inquiries"} received.
            {enriched.length > 0 && " Newest first."}
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

      {/* KPI CARDS — 7 across on wide, wraps below */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        <KpiCard
          icon={<Inbox className="h-4 w-4" />}
          bg="bg-[#E4EAD9]"
          tone="text-[#5D7050]"
          label="All Inquiries"
          value={counts.all}
          sub="Total"
          href="/admin/inquiries"
          active={!statusFilter && !sourceFilter}
        />
        <KpiCard
          icon={<Circle className="h-4 w-4 fill-current" />}
          bg="bg-[#F6D8D4]"
          tone="text-[#B84A45]"
          label="New"
          value={counts.new}
          sub={`${pct(counts.new)}% of total`}
          href={`/admin/inquiries?status=new${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "new"}
        />
        <KpiCard
          icon={<Circle className="h-4 w-4 fill-current" />}
          bg="bg-[#F5E3CC]"
          tone="text-[#B36B1E]"
          label="Open"
          value={counts.open}
          sub={`${pct(counts.open)}% of total`}
          href={`/admin/inquiries?status=open${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "open"}
        />
        <KpiCard
          icon={<Send className="h-4 w-4" />}
          bg="bg-[#EDE5F7]"
          tone="text-[#6B5091]"
          label="Quote Sent"
          value={counts["quote-sent"]}
          sub={`${pct(counts["quote-sent"])}% of total`}
          href={`/admin/inquiries?status=quote-sent${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "quote-sent"}
        />
        <KpiCard
          icon={<MessageCircle className="h-4 w-4" />}
          bg="bg-[#F9DAC8]"
          tone="text-[#D9855A]"
          label="Negotiating"
          value={counts.negotiating}
          sub={`${pct(counts.negotiating)}% of total`}
          href={`/admin/inquiries?status=negotiating${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "negotiating"}
        />
        <KpiCard
          icon={<CheckCircle2 className="h-4 w-4" />}
          bg="bg-[#D8E9DD]"
          tone="text-[#3E6B4C]"
          label="Booked"
          value={counts.booked}
          sub={`${pct(counts.booked)}% of total`}
          href={`/admin/inquiries?status=booked${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "booked"}
        />
        <KpiCard
          icon={<XCircle className="h-4 w-4" />}
          bg="bg-[#E5D5CD]"
          tone="text-[#8A6B5F]"
          label="Lost"
          value={counts.lost}
          sub={`${pct(counts.lost)}% of total`}
          href={`/admin/inquiries?status=lost${sourceFilter ? `&source=${sourceFilter}` : ""}`}
          active={statusFilter === "lost"}
        />
      </div>

      {/* FILTER ROWS — Status + Source */}
      <div className="mt-6 space-y-3">
        <FilterRow label="Status">
          <FilterPill
            label="All"
            active={!statusFilter}
            href={
              sourceFilter
                ? `/admin/inquiries?source=${sourceFilter}`
                : "/admin/inquiries"
            }
          />
          {STATUS_ORDER.map((s) => (
            <FilterPill
              key={s}
              label={STATUS_LABEL[s]}
              dotClass={STATUS_ICON[s].dot}
              active={statusFilter === s}
              href={`/admin/inquiries?status=${s}${sourceFilter ? `&source=${sourceFilter}` : ""}`}
            />
          ))}
        </FilterRow>
        <FilterRow label="Source">
          <FilterPill
            label="All"
            active={!sourceFilter}
            href={
              statusFilter
                ? `/admin/inquiries?status=${statusFilter}`
                : "/admin/inquiries"
            }
          />
          {(
            ["website", "whatsapp", "instagram", "partner", "referral", "concierge"] as Source[]
          ).map((s) => (
            <FilterPill
              key={s}
              label={SOURCE_LABEL[s]}
              active={sourceFilter === s}
              href={`/admin/inquiries?source=${s}${statusFilter ? `&status=${statusFilter}` : ""}`}
            />
          ))}
        </FilterRow>
      </div>

      {/* LIST + DETAIL PANEL */}
      <div
        className={`mt-6 grid gap-6 ${selected ? "lg:grid-cols-[minmax(0,1fr)_380px]" : ""}`}
      >
        {/* Table */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-[hsl(38_18%_88%)] bg-white">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <Inbox className="h-8 w-8 text-[#8A8072]" strokeWidth={1.5} />
              <p className="text-sm text-[#8A8072]">
                {enriched.length === 0
                  ? "No inquiries yet — new leads will land here."
                  : "Nothing matches this filter."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="whitespace-nowrap text-left text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#857B6C]">
                    <th className="px-4 py-3">Guest</th>
                    <th className="px-4 py-3">Property</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Guests</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3">Follow-up</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {visible.map((e) => {
                    const villa = e.q.villa ? getVillaBySlug(e.q.villa) : undefined;
                    const experience = e.q.experience
                      ? getExperienceBySlug(e.q.experience)
                      : undefined;
                    const nights = nightsBetween(e.q.checkIn, e.q.checkOut);
                    const prio = PRIORITY_META[e.priority];
                    const isSelected = selected?.q.id === e.q.id;
                    const rowHref = `/admin/inquiries?${new URLSearchParams({
                      ...(statusFilter ? { status: statusFilter } : {}),
                      ...(sourceFilter ? { source: sourceFilter } : {}),
                      id: e.q.id,
                    }).toString()}`;
                    const haystack = [
                      e.q.name,
                      e.q.phone,
                      e.q.email,
                      villa?.name,
                      experience?.name,
                      e.q.villa,
                      e.q.experience,
                      villa?.city,
                      villa?.state,
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();
                    return (
                      <tr
                        key={e.q.id}
                        data-search={haystack}
                        className={`border-t border-[hsl(38_18%_92%)] transition-colors ${
                          isSelected
                            ? "bg-[hsl(85_25%_95%)]"
                            : "hover:bg-[hsl(38_30%_97%)]"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <Link href={rowHref} className="flex items-center gap-2.5">
                            <div
                              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${avatarBg(e.q.name)}`}
                            >
                              {initials(e.q.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-[#2A2A2A]">
                                {e.q.name}
                              </p>
                              <p className="truncate text-[11px] text-[#8A8072]">
                                {e.q.phone}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <Link href={rowHref} className="flex items-center gap-2.5">
                            <div className="relative h-9 w-11 shrink-0 overflow-hidden rounded-md bg-[hsl(38_30%_93%)]">
                              {(villa?.images[0]?.src ?? experience?.image.src) && (
                                <Image
                                  src={(villa?.images[0]?.src ?? experience?.image.src)!}
                                  alt=""
                                  fill
                                  sizes="44px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-[13px] font-medium text-[#2A2A2A]">
                                {villa?.name ?? experience?.name ?? e.q.villa ?? e.q.experience ?? "—"}
                              </p>
                              <p className="truncate text-[11px] text-[#8A8072]">
                                {experience
                                  ? `Experience · ${[experience.city, experience.state].filter(Boolean).join(", ")}`
                                  : [villa?.city, villa?.state].filter(Boolean).join(", ")}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="admin-numeric px-4 py-3 text-[13px] text-[#4A4235]">
                          <Link href={rowHref} className="block">
                            <p>{formatDates(e.q)}</p>
                            {nights > 0 && (
                              <p className="text-[11px] text-[#8A8072]">
                                {nights} night{nights === 1 ? "" : "s"}
                              </p>
                            )}
                          </Link>
                        </td>
                        <td className="admin-numeric px-4 py-3 text-[13px] text-[#4A4235]">
                          <Link href={rowHref} className="block">
                            <p>
                              {(e.q.adults ?? e.q.guests ?? 0)} Adult
                              {(e.q.adults ?? e.q.guests ?? 0) === 1 ? "" : "s"}
                              {(e.q.children ?? 0) > 0 &&
                                `, ${e.q.children} Child${(e.q.children ?? 0) === 1 ? "" : "ren"}`}
                            </p>
                            {(e.q.rooms ?? 0) > 0 && (
                              <p className="text-[11px] text-[#8A8072]">
                                {e.q.rooms} Room{e.q.rooms === 1 ? "" : "s"}
                              </p>
                            )}
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_PILL[e.normalized]}`}
                          >
                            <span
                              className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_ICON[e.normalized].dot}`}
                            />
                            {STATUS_LABEL[e.normalized]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${prio.pill} ${prio.tone}`}
                            title={`Priority: ${prio.label}`}
                          >
                            <prio.Icon className="h-3 w-3" />
                            {prio.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <SourceIcon source={e.source} />
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#8A8072]">
                          {relativeTime(e.lastFollowUp)}
                        </td>
                        <td className="px-4 py-3">
                          <Link
                            href={rowHref}
                            aria-label="Open details"
                            className="grid h-7 w-7 place-items-center rounded-full text-[#8A8072] hover:bg-[hsl(38_30%_93%)]"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div
                id="inquiry-search-empty"
                hidden
                className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center"
              >
                <Search className="h-8 w-8 text-[#8A8072]" strokeWidth={1.5} />
                <p className="text-sm text-[#8A8072]">
                  No inquiries match your search.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* Detail panel */}
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

function KpiCard({
  icon,
  bg,
  tone,
  label,
  value,
  sub,
  href,
  active,
}: {
  icon: React.ReactNode;
  bg: string;
  tone: string;
  label: string;
  value: number;
  sub: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border bg-white p-4 transition-colors ${
        active
          ? "border-[#5D7050] ring-1 ring-[#5D7050]/30"
          : "border-[hsl(38_18%_88%)] hover:border-[hsl(38_18%_80%)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${bg} ${tone}`}
        >
          {icon}
        </span>
        <p className="text-[11px] font-medium text-[#8A8072]">{label}</p>
      </div>
      <p className="mt-2 font-numeric text-2xl font-semibold leading-none tabular-nums text-[#2A2A2A]">
        {value}
      </p>
      <p className="mt-1 text-[10px] text-[#8A8072]">{sub}</p>
    </Link>
  );
}

function FilterRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-[0.14em] text-[#8A8072]">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterPill({
  label,
  href,
  active,
  dotClass,
}: {
  label: string;
  href: string;
  active: boolean;
  dotClass?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
        active
          ? "bg-[#2A2A2A] text-white"
          : "border border-[hsl(38_18%_88%)] bg-white text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
      }`}
    >
      {dotClass && <span className={`inline-block h-2 w-2 rounded-full ${dotClass}`} />}
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
    priority: Priority;
    lastFollowUp: string;
  };
  statusFilter?: CanonicalStatus;
  sourceFilter?: Source;
}) {
  const { q, normalized, source, priority, lastFollowUp } = entry;
  const villa = q.villa ? getVillaBySlug(q.villa) : undefined;
  const nights = nightsBetween(q.checkIn, q.checkOut);
  const closeHref = `/admin/inquiries?${new URLSearchParams({
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(sourceFilter ? { source: sourceFilter } : {}),
  }).toString()}`;
  const waHref = `https://wa.me/${q.phone.replace(/\D/g, "")}`;
  const telHref = `tel:${q.phone}`;
  const mailHref = q.email ? `mailto:${q.email}` : undefined;

  return (
    <aside className="rounded-2xl border border-[hsl(38_18%_88%)] bg-white lg:sticky lg:top-6 lg:self-start">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <div
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-semibold ${avatarBg(q.name)}`}
          >
            {initials(q.name)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-[#2A2A2A]">{q.name}</p>
            <p className="mt-0.5 text-[11px] text-[#8A8072]">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_PILL[normalized]}`}
              >
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${STATUS_ICON[normalized].dot}`}
                />
                {STATUS_LABEL[normalized]}
              </span>
              <span className="ml-2 inline-flex items-center gap-1">
                <PRIORITY_META_ICON priority={priority} />
                {PRIORITY_META[priority].label}
              </span>
            </p>
          </div>
        </div>
        <Link
          href={closeHref}
          aria-label="Close details"
          className="grid h-8 w-8 place-items-center rounded-full text-[#8A8072] hover:bg-[hsl(38_30%_93%)]"
        >
          <X className="h-4 w-4" />
        </Link>
      </div>

      {/* Contact info */}
      <div className="space-y-2 border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <ContactLine
          icon={<Phone className="h-3.5 w-3.5 text-[#8A8072]" />}
          text={q.phone}
        />
        {q.email && (
          <ContactLine
            icon={<Mail className="h-3.5 w-3.5 text-[#8A8072]" />}
            text={q.email}
          />
        )}
      </div>

      {/* Actions */}
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
          href={telHref}
          bg="bg-[#F9DAC8]"
          tone="text-[#D9855A]"
          label="Call"
          icon={<Phone className="h-4 w-4" />}
        />
        <ActionBtn
          href={mailHref}
          bg="bg-[#EDE5F7]"
          tone="text-[#6B5091]"
          label="Email"
          icon={<Mail className="h-4 w-4" />}
        />
      </div>

      {/* Inquiry Details */}
      <div className="border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-[#2A2A2A]">Inquiry Details</p>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1 text-[10px] text-[#8A8072] opacity-50"
            title="Editing coming soon"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        </div>
        <dl className="mt-3 space-y-2 text-xs">
          <DetailRow
            label="Property"
            value={villa?.name ?? q.villa ?? "—"}
          />
          <DetailRow
            label="Location"
            value={
              [villa?.city, villa?.state].filter(Boolean).join(", ") || "—"
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
          <DetailRow
            label="Guests"
            value={
              [
                (q.adults ?? q.guests ?? 0) > 0
                  ? `${q.adults ?? q.guests} Adult${(q.adults ?? q.guests) === 1 ? "" : "s"}`
                  : null,
                (q.children ?? 0) > 0
                  ? `${q.children} Child${(q.children ?? 0) === 1 ? "" : "ren"}`
                  : null,
                (q.rooms ?? 0) > 0
                  ? `${q.rooms} Room${q.rooms === 1 ? "" : "s"}`
                  : null,
              ]
                .filter(Boolean)
                .join(", ") || "—"
            }
          />
          {q.bookingItems && q.bookingItems.length > 0 && (
            <DetailRow
              label={q.bookingItems.some((it) => it.selectedInventoryIds?.length) ? "Beds" : "Rooms"}
              value={
                <span className="grid gap-0.5">
                  {q.bookingItems.map((it, i) => (
                    <span key={i}>
                      {it.quantity}× {it.unitName}
                      {it.unitPrice != null
                        ? ` @ ₹${it.unitPrice.toLocaleString("en-IN")}/night`
                        : ""}
                      {it.selectedInventoryIds?.length
                        ? ` (${it.selectedInventoryIds.length} bed${it.selectedInventoryIds.length === 1 ? "" : "s"} selected)`
                        : ""}
                    </span>
                  ))}
                </span>
              }
            />
          )}
          <DetailRow label="Source" value={SOURCE_LABEL[source]} />
          <DetailRow label="Assigned To" value="Admin" />
          <DetailRow
            label="Created"
            value={`${DATE_LONG.format(new Date(q.createdAt))}, ${TIME_LONG.format(new Date(q.createdAt))}`}
          />
          <DetailRow label="Last Follow-up" value={relativeTime(lastFollowUp)} />
        </dl>
      </div>

      {/* Status + Internal Note (existing StatusControl handles both) */}
      <div className="border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <p className="mb-2 text-xs font-semibold text-[#2A2A2A]">
          Status &amp; Internal Note
        </p>
        <StatusControl
          id={q.id}
          initialStatus={q.status ?? "new"}
          initialNote={q.note ?? ""}
        />
      </div>

      {/* Tags (placeholder) */}
      <div className="border-b border-[hsl(38_18%_92%)] px-5 py-4">
        <p className="mb-2 text-xs font-semibold text-[#2A2A2A]">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          <TagChip>{q.kind === "experience" ? "Concierge" : "Guest"}</TagChip>
          <TagChip>{SOURCE_LABEL[source]}</TagChip>
          {(q.adults ?? q.guests ?? 0) >= 6 && <TagChip>Group</TagChip>}
          <button
            type="button"
            disabled
            className="inline-flex h-6 items-center gap-1 rounded-full border border-dashed border-[hsl(38_18%_82%)] px-2.5 text-[11px] text-[#8A8072] opacity-70"
            title="Tag editor coming soon"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Quick actions (placeholder) */}
      <div className="px-5 py-4">
        <p className="mb-3 text-xs font-semibold text-[#2A2A2A]">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <QuickActionBtn label="Send Villa Options" />
          <QuickActionBtn label="Send Quote" />
          <QuickActionBtn label="Create Task" />
          <QuickActionBtn label="Add Note" />
        </div>
        <p className="mt-3 text-[10px] text-[#8A8072]">
          Quick actions are placeholders for Phase B — wire them once you decide
          the workflow (WhatsApp templates, PDF quote, task tracker).
        </p>
      </div>
    </aside>
  );
}

function ContactLine({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-[#4A4235]">
      {icon}
      <span className="truncate">{text}</span>
    </div>
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[#8A8072]">{label}</dt>
      <dd className="min-w-0 flex-1 text-right text-[#2A2A2A]">{value}</dd>
    </div>
  );
}

function TagChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[hsl(38_30%_93%)] px-2.5 text-[11px] font-medium text-[#4A4235]">
      {children}
    </span>
  );
}

function QuickActionBtn({ label }: { label: string }) {
  return (
    <button
      type="button"
      disabled
      className="rounded-lg border border-[hsl(38_18%_88%)] bg-white px-3 py-2.5 text-left text-[11px] font-medium text-[#4A4235] opacity-70"
      title="Coming soon"
    >
      {label}
    </button>
  );
}

function PRIORITY_META_ICON({ priority }: { priority: Priority }) {
  const m = PRIORITY_META[priority];
  return <m.Icon className={`h-3 w-3 ${m.tone}`} />;
}

/** Silence unused warning — this stays exported-adjacent for callers that
 *  may want to render the more-actions kebab menu in a future Phase B. */
void MoreVertical;
