import { Eye, Inbox, CheckCircle2, TrendingUp, BedDouble, Percent } from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import { getRecentViewCountsSync } from "@/lib/data/villa-views";
import { formatINRCompact, getHostData } from "@/lib/host-metrics";
import {
  getPropertyPerformance,
  summarisePerformance,
} from "@/lib/host/property-performance";
import { buildOpportunities } from "@/lib/host/opportunities";
import { PropertyPerformanceTable } from "@/components/host/property-performance-table";
import { OpportunitiesPanel } from "@/components/host/opportunities-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Performance · Hosting" };

export default async function HostPerformancePage() {
  const user = await requireHost();
  const data = await getHostData(user.id);
  const views = getRecentViewCountsSync();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthLabel = now.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  const performance = getPropertyPerformance(data, views, year, month);
  const totals = summarisePerformance(performance);
  const opportunities = buildOpportunities(data, performance);

  const decided = data.requests.filter((q) => q.hostDecision);
  const accepted = decided.filter((q) => q.hostDecision === "accepted");
  const acceptRate =
    decided.length > 0
      ? Math.round((accepted.length / decided.length) * 100)
      : null;

  // Every card shows "—" rather than 0 when the metric has no basis.
  const cards = [
    { icon: Eye, label: "Listing views · 30 days", value: String(totals.views) },
    { icon: Inbox, label: "Booking requests", value: String(totals.inquiries) },
    {
      icon: CheckCircle2,
      label: "Acceptance rate",
      value: acceptRate === null ? "—" : `${acceptRate}%`,
    },
    {
      icon: TrendingUp,
      label: "View → request",
      // Both sides are the same 30-day window, so this can't exceed 100%.
      value:
        totals.views > 0
          ? `${Math.round((totals.recentInquiries / totals.views) * 100)}%`
          : "—",
    },
    {
      icon: BedDouble,
      label: `ADR · ${monthLabel}`,
      value: totals.adr === null ? "—" : formatINRCompact(totals.adr),
    },
    {
      icon: Percent,
      label: `Occupancy · ${monthLabel}`,
      value: `${totals.occupancy}%`,
    },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl sm:text-4xl">Performance</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        How guests are finding and booking your properties.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-border/60 bg-background p-4"
          >
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
              <span className="text-[13px]">{c.label}</span>
            </div>
            <p className="mt-2 font-numeric text-2xl font-semibold tabular-nums tracking-tight">
              {c.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <PropertyPerformanceTable rows={performance} monthLabel={monthLabel} />
      </div>

      <div className="mt-10">
        <OpportunitiesPanel opportunities={opportunities} />
      </div>
    </div>
  );
}
