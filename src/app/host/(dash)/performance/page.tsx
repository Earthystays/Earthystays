import { Eye, Inbox, CheckCircle2, TrendingUp } from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import { getRecentViewCountsSync } from "@/lib/data/villa-views";
import { bookingsForMonth, dailyRevenue, formatINRCompact, getHostData } from "@/lib/host-metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Performance · Hosting" };

export default async function HostPerformancePage() {
  const user = await requireHost();
  const data = await getHostData(user.id);
  const views = getRecentViewCountsSync();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const totalViews = data.listings.reduce((n, l) => n + (views[l.slug] ?? 0), 0);
  const totalRequests = data.requests.length;
  const decided = data.requests.filter((q) => q.hostDecision);
  const accepted = decided.filter((q) => q.hostDecision === "accepted");
  const acceptRate = decided.length > 0 ? Math.round((accepted.length / decided.length) * 100) : null;
  const conversion = totalViews > 0 ? Math.round((totalRequests / totalViews) * 100) : null;

  const cards = [
    { icon: Eye, label: "Listing views · 30 days", value: String(totalViews) },
    { icon: Inbox, label: "Booking requests", value: String(totalRequests) },
    { icon: CheckCircle2, label: "Acceptance rate", value: acceptRate === null ? "—" : `${acceptRate}%` },
    { icon: TrendingUp, label: "View → request", value: conversion === null ? "—" : `${conversion}%` },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl sm:text-4xl">Performance</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        How guests are finding and booking your properties.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <c.icon className="h-4 w-4" strokeWidth={1.8} />
              <span className="text-[13px]">{c.label}</span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-border/60 bg-background">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-5 py-3.5 font-medium">Listing</th>
              <th className="px-5 py-3.5 font-medium">Views · 30d</th>
              <th className="px-5 py-3.5 font-medium">Requests</th>
              <th className="px-5 py-3.5 font-medium">Accepted</th>
              <th className="px-5 py-3.5 font-medium">Revenue (month)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {data.listings.map((l) => {
              const reqs = data.requests.filter((q) => q.villa === l.slug);
              const acc = reqs.filter((q) => q.hostDecision === "accepted");
              const revenue = dailyRevenue(
                bookingsForMonth(data.bookings.filter((b) => b.villa.slug === l.slug), year, month),
                year,
                month,
              ).reduce((a, b) => a + b, 0);
              return (
                <tr key={l.slug}>
                  <td className="max-w-[280px] truncate px-5 py-3.5 font-medium">{l.name}</td>
                  <td className="px-5 py-3.5">{views[l.slug] ?? 0}</td>
                  <td className="px-5 py-3.5">{reqs.length}</td>
                  <td className="px-5 py-3.5">{acc.length}</td>
                  <td className="px-5 py-3.5">{formatINRCompact(revenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[13px] text-muted-foreground">
        Views count opens of your public listing page in the last 30 days. Revenue is indicative
        (nights × nightly price) — the concierge team settles final amounts.
      </p>
    </div>
  );
}
