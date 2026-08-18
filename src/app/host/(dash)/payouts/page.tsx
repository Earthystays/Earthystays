import { Wallet } from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import { addDays, formatINR, getHostData } from "@/lib/host-metrics";

export const dynamic = "force-dynamic";
export const metadata = { title: "Payouts · Hosting" };

function fmt(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function HostPayoutsPage() {
  const user = await requireHost();
  const data = await getHostData(user.id);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const upcoming = data.bookings
    .filter((b) => b.checkOut >= today)
    .sort((a, b) => a.checkOut.getTime() - b.checkOut.getTime());
  const completed = data.bookings
    .filter((b) => b.checkOut < today)
    .sort((a, b) => b.checkOut.getTime() - a.checkOut.getTime());

  const nextDate = upcoming[0]?.checkOut;
  const windowEnd = nextDate ? addDays(nextDate, 7) : undefined;
  const nextAmount = nextDate
    ? upcoming.filter((b) => b.checkOut <= windowEnd!).reduce((n, b) => n + b.amount, 0)
    : 0;
  const monthEarned = completed
    .filter((b) => b.checkOut.getMonth() === now.getMonth() && b.checkOut.getFullYear() === now.getFullYear())
    .reduce((n, b) => n + b.amount, 0);

  const rows = [...upcoming, ...completed];

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl sm:text-4xl">Payouts</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Earnings from your confirmed stays. The Earthy Stays concierge settles payouts with you
        directly after each checkout — amounts here are indicative (nights × nightly price).
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Wallet className="h-4 w-4" strokeWidth={1.8} />
            <span className="text-[13px]">Next payout</span>
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {nextAmount > 0 ? formatINR(nextAmount) : "—"}
          </p>
          {nextDate && <p className="mt-1 text-sm text-muted-foreground">after {fmt(nextDate)}</p>}
        </div>
        <div className="rounded-2xl border border-border/60 bg-background p-5">
          <p className="text-[13px] text-muted-foreground">Settled stays this month</p>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            {monthEarned > 0 ? formatINR(monthEarned) : "—"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{completed.length} completed stay{completed.length === 1 ? "" : "s"} overall</p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            Accepted bookings appear here with their payout status.
          </p>
        </div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border/60 bg-background">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3.5 font-medium">Guest</th>
                <th className="px-5 py-3.5 font-medium">Listing</th>
                <th className="px-5 py-3.5 font-medium">Stay</th>
                <th className="px-5 py-3.5 font-medium">Amount</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {rows.map((b) => {
                const done = b.checkOut < today;
                return (
                  <tr key={b.inquiry.id}>
                    <td className="px-5 py-3.5 font-medium">{b.inquiry.name}</td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-muted-foreground">{b.villa.name}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-muted-foreground">
                      {b.checkIn.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} –{" "}
                      {b.checkOut.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.nights}n
                    </td>
                    <td className="px-5 py-3.5 font-medium">{formatINR(b.amount)}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          done
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {done ? "Ready to settle" : "After checkout"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
