import type { ListingStatus } from "@/lib/types";

const STYLES: Record<ListingStatus, { label: string; cls: string }> = {
  approved: { label: "Live", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending_review: { label: "In review", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  draft: { label: "Draft", cls: "bg-muted text-muted-foreground border-border" },
  rejected: { label: "Needs changes", cls: "bg-red-50 text-red-700 border-red-200" },
  hidden: { label: "Hidden", cls: "bg-muted text-muted-foreground border-border" },
};

export function StatusPill({ status }: { status?: ListingStatus }) {
  const s = STYLES[status ?? "approved"];
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}
