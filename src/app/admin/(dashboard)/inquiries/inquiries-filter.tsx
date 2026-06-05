"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Counts = {
  all: number;
  new: number;
  open: number;
  shared: number;
  closed: number;
  guest: number;
  partner: number;
  callback: number;
};

export function InquiriesFilter({
  counts,
  current,
  currentKind,
}: {
  counts: Counts;
  current?: string;
  currentKind?: string;
}) {
  const sp = useSearchParams();

  function href(patch: { status?: string | null; kind?: string | null }) {
    const p = new URLSearchParams(sp.toString());
    if (patch.status === null) p.delete("status");
    else if (patch.status !== undefined) p.set("status", patch.status);
    if (patch.kind === null) p.delete("kind");
    else if (patch.kind !== undefined) p.set("kind", patch.kind);
    const q = p.toString();
    return `/admin/inquiries${q ? `?${q}` : ""}`;
  }

  const statusPills = [
    { label: "All", value: null, count: counts.all },
    { label: "New", value: "new", count: counts.new, dot: "bg-slate-400" },
    { label: "Open", value: "open", count: counts.open, dot: "bg-blue-500" },
    {
      label: "Details Shared",
      value: "shared",
      count: counts.shared,
      dot: "bg-terracotta",
    },
    { label: "Closed", value: "closed", count: counts.closed, dot: "bg-emerald-500" },
  ];

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {statusPills.map((p) => {
        const active = (p.value ?? null) === (current ?? null);
        return (
          <Link
            key={p.label}
            href={href({ status: p.value })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
              active
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            {p.dot && <span className={`inline-block h-2 w-2 rounded-full ${p.dot}`} />}
            {p.label}
            <span
              className={`text-[10px] ${active ? "opacity-80" : "text-muted-foreground"}`}
            >
              {p.count}
            </span>
          </Link>
        );
      })}

      {(counts.partner > 0 || counts.callback > 0 || currentKind) && (
        <>
          <span className="self-center text-border">|</span>
          <Link
            href={href({ kind: null })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
              !currentKind
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            All types
          </Link>
          <Link
            href={href({ kind: "guest" })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
              currentKind === "guest"
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Guest ({counts.guest})
          </Link>
          <Link
            href={href({ kind: "callback" })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
              currentKind === "callback"
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Callback ({counts.callback})
          </Link>
          <Link
            href={href({ kind: "partner" })}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs transition-colors ${
              currentKind === "partner"
                ? "bg-foreground text-background"
                : "border border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            Partner ({counts.partner})
          </Link>
        </>
      )}
    </div>
  );
}
