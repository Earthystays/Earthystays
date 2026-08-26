import { formatINR } from "@/lib/format";
import { bpsToPercent } from "@/lib/host/economics";
import type { EconomicsTotals, PropertyEconomics } from "@/lib/host/economics";
import type { MonthlyRevenue } from "@/lib/host/economics";

/**
 * Per-property economics: what the booking was worth, what Earthy Stays
 * retains, and what the owner is due.
 *
 * The commission rate is passed in from the finance module — this component
 * never hardcodes a percentage, it only formats the one it is given.
 */
export function PropertyEconomicsTable({
  rows,
  totals,
}: {
  rows: PropertyEconomics[];
  totals: EconomicsTotals;
}) {
  const withRevenue = rows.filter((r) => r.grossRevenue > 0);
  if (withRevenue.length === 0) return null;

  const ratePct = bpsToPercent(totals.commissionBps);

  return (
    <section aria-labelledby="economics-heading" className="mt-10">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id="economics-heading"
          className="font-display text-xl font-bold tracking-tight text-foreground"
        >
          Property economics
        </h2>
        <p className="text-sm text-muted-foreground">
          Commission {ratePct}%
        </p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-background">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <caption className="sr-only">
            Revenue, Earthy Stays commission and owner payout per property
          </caption>
          <thead>
            <tr className="border-b border-border/60 text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th scope="col" className="px-5 py-3.5 font-medium">Property</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Stays</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">Revenue</th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">
                Earthy commission
              </th>
              <th scope="col" className="px-5 py-3.5 text-right font-medium">
                Owner payout
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {withRevenue.map((r) => (
              <tr key={r.slug}>
                <th
                  scope="row"
                  className="max-w-[240px] truncate px-5 py-3.5 text-left font-medium text-foreground"
                >
                  {r.name}
                </th>
                <td className="px-5 py-3.5 text-right font-numeric tabular-nums text-muted-foreground">
                  {r.stays}
                </td>
                <td className="px-5 py-3.5 text-right font-numeric tabular-nums text-foreground">
                  {formatINR(r.grossRevenue)}
                </td>
                <td className="px-5 py-3.5 text-right font-numeric tabular-nums text-muted-foreground">
                  −{formatINR(r.commission)}
                </td>
                <td className="px-5 py-3.5 text-right font-numeric font-semibold tabular-nums text-foreground">
                  {formatINR(r.ownerPayout)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border/60 bg-muted/30">
              <th scope="row" className="px-5 py-3.5 text-left font-semibold">
                Total
              </th>
              <td className="px-5 py-3.5 text-right font-numeric tabular-nums">
                {totals.stays}
              </td>
              <td className="px-5 py-3.5 text-right font-numeric tabular-nums">
                {formatINR(totals.grossRevenue)}
              </td>
              <td className="px-5 py-3.5 text-right font-numeric tabular-nums">
                −{formatINR(totals.commission)}
              </td>
              <td className="px-5 py-3.5 text-right font-numeric font-semibold tabular-nums">
                {formatINR(totals.ownerPayout)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
        Revenue is indicative (nights × nightly price) across all accepted
        stays. Commission is applied at the current {ratePct}% rate. Taxes,
        refunds and gateway fees are settled by the concierge team and are not
        reflected above.
      </p>
    </section>
  );
}

/** Six-month revenue history as a simple, dependency-free bar chart. */
export function RevenueHistory({ months }: { months: MonthlyRevenue[] }) {
  const max = Math.max(...months.map((m) => m.grossRevenue), 1);
  const hasAny = months.some((m) => m.grossRevenue > 0);
  if (!hasAny) return null;

  return (
    <section aria-labelledby="revenue-history-heading" className="mt-10">
      <h2
        id="revenue-history-heading"
        className="font-display text-xl font-bold tracking-tight text-foreground"
      >
        Revenue history
      </h2>

      <div className="mt-4 rounded-2xl border border-border/60 bg-background p-5">
        <ul className="flex items-end gap-3 sm:gap-5">
          {months.map((m) => {
            const pct = Math.round((m.grossRevenue / max) * 100);
            return (
              <li key={m.key} className="flex flex-1 flex-col items-center gap-2">
                <span className="font-numeric text-[11px] tabular-nums text-muted-foreground">
                  {m.grossRevenue > 0 ? formatINR(m.ownerPayout) : ""}
                </span>
                <div
                  className="flex h-28 w-full items-end rounded-md bg-muted/50"
                  role="img"
                  aria-label={`${m.label}: owner payout ${formatINR(m.ownerPayout)} from ${m.stays} ${m.stays === 1 ? "stay" : "stays"}`}
                >
                  <div
                    className="w-full rounded-md bg-primary/80"
                    style={{ height: `${Math.max(pct, m.grossRevenue > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{m.label}</span>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-xs text-muted-foreground">
          Owner payout by checkout month, net of commission.
        </p>
      </div>
    </section>
  );
}
