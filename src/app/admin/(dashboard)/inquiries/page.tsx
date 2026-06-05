import Link from "next/link";
import { readJson } from "@/lib/storage";
import type { StoredInquiry } from "@/app/api/inquiries/route";
import {
  Inbox,
  Phone,
  Mail,
  Calendar,
  Users,
  Home,
  MapPin,
  Building2,
} from "lucide-react";
import { StatusControl } from "./status-control";
import { InquiriesFilter } from "./inquiries-filter";

type SearchParams = Promise<{ status?: string; kind?: string }>;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const all = await readJson<StoredInquiry[]>("inquiries.json", []);
  // Sort newest first
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const sp = await searchParams;
  const statusFilter = sp.status as StoredInquiry["status"] | undefined;
  const kindFilter = sp.kind as StoredInquiry["kind"] | undefined;

  const inquiries = all.filter((q) => {
    const qStatus = q.status ?? "new";
    if (statusFilter && qStatus !== statusFilter) return false;
    if (kindFilter && (q.kind ?? "guest") !== kindFilter) return false;
    return true;
  });

  // Counts for filter pills
  const counts = {
    all: all.length,
    new: all.filter((q) => (q.status ?? "new") === "new").length,
    open: all.filter((q) => q.status === "open").length,
    shared: all.filter((q) => q.status === "shared").length,
    closed: all.filter((q) => q.status === "closed").length,
    guest: all.filter((q) => (q.kind ?? "guest") === "guest").length,
    partner: all.filter((q) => q.kind === "partner").length,
    callback: all.filter((q) => q.kind === "callback").length,
  };

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Inquiries</h1>
        <p className="mt-2 text-muted-foreground">
          {all.length} {all.length === 1 ? "inquiry" : "inquiries"} received.
          {all.length > 0 && " Newest first."}
        </p>
      </header>

      {all.length > 0 && (
        <InquiriesFilter counts={counts} current={statusFilter} currentKind={kindFilter} />
      )}

      {inquiries.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <Inbox className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">
            {all.length === 0 ? "No inquiries yet" : "Nothing matches that filter"}
          </h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            {all.length === 0 ? (
              <>
                When a guest submits the inquiry form on any villa page or via{" "}
                <Link href="/partner" className="text-terracotta underline">
                  /partner
                </Link>
                , it&apos;ll land here.
              </>
            ) : (
              <>Try switching to All or another status.</>
            )}
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {inquiries.map((q) => (
            <InquiryCard key={q.id} q={q} />
          ))}
        </ul>
      )}
    </div>
  );
}

function InquiryCard({ q }: { q: StoredInquiry }) {
  const isPartner = q.kind === "partner";
  const isCallback = q.kind === "callback";

  return (
    <li className="rounded-2xl border border-border/60 bg-card p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-display text-xl text-foreground">{q.name}</p>
            {isPartner && (
              <span className="inline-flex items-center rounded-full bg-terracotta/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-terracotta">
                Partner
              </span>
            )}
            {isCallback && (
              <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-600">
                Callback
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {q.phone && (
              <a
                href={`tel:${q.phone}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {q.phone}
              </a>
            )}
            {q.email && (
              <a
                href={`mailto:${q.email}`}
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Mail className="h-3 w-3" />
                {q.email}
              </a>
            )}
          </div>
        </div>
        <time
          dateTime={q.createdAt}
          className="text-xs text-muted-foreground"
          title={new Date(q.createdAt).toLocaleString()}
        >
          {relativeTime(q.createdAt)}
        </time>
      </header>

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
        {q.villa && (
          <span className="inline-flex items-center gap-1.5">
            <Home className="h-3 w-3" />
            <Link
              href={`/villas/${q.villa}`}
              target="_blank"
              className="text-terracotta hover:underline"
            >
              {q.villa}
            </Link>
          </span>
        )}
        {q.city && (
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            {q.city}
          </span>
        )}
        {q.propertyType && (
          <span className="inline-flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            {q.propertyType}
          </span>
        )}
        {(q.checkIn || q.checkOut) && (
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-3 w-3" />
            {q.checkIn ?? "—"} → {q.checkOut ?? "—"}
          </span>
        )}
        {(q.adults || q.children || q.guests) && (
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3 w-3" />
            {q.adults !== undefined
              ? `${q.adults}A${q.children ? ` + ${q.children}C` : ""}${q.infants ? ` + ${q.infants}I` : ""}`
              : `${q.guests} guests`}
            {q.rooms ? ` · ${q.rooms} rooms` : ""}
          </span>
        )}
      </div>

      {q.message && (
        <p className="mt-4 whitespace-pre-line rounded-md bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
          {q.message}
        </p>
      )}

      {/* Status + internal note */}
      <div className="mt-4 grid gap-4 sm:grid-cols-[200px_1fr] sm:items-start">
        <StatusControl
          id={q.id}
          initialStatus={q.status ?? "new"}
          initialNote={q.note ?? ""}
        />
        <footer className="flex flex-wrap items-center gap-3 text-xs">
          {q.email && (
            <a
              href={`mailto:${q.email}?subject=${encodeURIComponent(
                "Re: your Earthy Stays inquiry",
              )}`}
              className="text-terracotta hover:underline"
            >
              Reply via email
            </a>
          )}
          {q.phone && (
            <>
              {q.email && <span className="text-muted-foreground">·</span>}
              <a
                href={`https://wa.me/${q.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-terracotta hover:underline"
              >
                Open WhatsApp
              </a>
              <span className="text-muted-foreground">·</span>
              <a href={`tel:${q.phone}`} className="text-terracotta hover:underline">
                Call
              </a>
            </>
          )}
        </footer>
      </div>
    </li>
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diff = now - then;
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
