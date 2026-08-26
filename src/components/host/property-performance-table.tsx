import Link from "next/link";
import { Star } from "lucide-react";
import { formatINRCompact } from "@/lib/format";
import type { PropertyPerformance } from "@/lib/host/property-performance";

/** An em dash reads as "we don't have this", which is different from zero. */
function num(v: number | null, format?: (n: number) => string): string {
  if (v === null) return "—";
  return format ? format(v) : String(v);
}

export function PropertyPerformanceTable({
  rows,
  monthLabel,
}: {
  rows: PropertyPerformance[];
  monthLabel: string;
}) {
  if (rows.length === 0) return null;

  return (
    <section aria-labelledby="property-performance-heading">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="property-performance-heading"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          Property performance
        </h2>
        <p className="text-sm text-muted-foreground">{monthLabel}</p>
      </div>

      {/* Wide table scrolls inside its own container so the page never does. */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-background">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <caption className="sr-only">
            Views, inquiries, bookings, revenue, occupancy and rating per property
          </caption>
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-4 py-3 font-medium">Property</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Views</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Inquiries</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Bookings</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Revenue</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">ADR</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Occupancy</th>
              <th scope="col" className="px-4 py-3 text-right font-medium">Rating</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.slug} className="border-b border-border/40 last:border-0">
                <th scope="row" className="px-4 py-3 text-left font-medium text-foreground">
                  <Link
                    href={`/host/listings/${r.slug}/edit`}
                    className="hover:text-terracotta"
                  >
                    {r.name}
                  </Link>
                </th>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-muted-foreground">
                  {r.views}
                </td>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-muted-foreground">
                  {r.inquiries}
                </td>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-muted-foreground">
                  {r.bookings}
                </td>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-foreground">
                  {r.revenue > 0 ? formatINRCompact(r.revenue) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-muted-foreground">
                  {num(r.adr, formatINRCompact)}
                </td>
                <td className="px-4 py-3 text-right font-numeric tabular-nums text-muted-foreground">
                  {r.occupancy}%
                </td>
                <td className="px-4 py-3 text-right">
                  {r.rating === null ? (
                    <span className="text-muted-foreground">—</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-numeric tabular-nums text-foreground">
                      <Star
                        className="h-3.5 w-3.5 fill-terracotta text-terracotta"
                        aria-hidden="true"
                      />
                      {r.rating.toFixed(1)}
                      <span className="text-xs text-muted-foreground">
                        ({r.reviewCount})
                      </span>
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        Revenue, ADR and occupancy cover {monthLabel}. Views are the last 30
        days. Revenue is indicative — nights × nightly price — and settled by
        the concierge after checkout.
      </p>
    </section>
  );
}
