import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  CalendarCheck2,
  ChevronRight,
  Clock3,
  MessageSquare,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { requireHost } from "@/lib/host-auth";
import {
  addDays,
  bookingsForMonth,
  dailyRevenue,
  dayKey,
  formatINR,
  getHostData,
  occupancyPct,
  occupiesNight,
  type HostBooking,
} from "@/lib/host-metrics";
import { unreadCount } from "@/lib/data/messages";
import { findUserById } from "@/lib/data/users";
import { EarningsChart, OccupancyDonut } from "@/components/host/earnings-chart";
import { TasksChecklist } from "@/components/host/tasks-checklist";

export const dynamic = "force-dynamic";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtShort(d: Date): string {
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default async function HostOverviewPage() {
  const user = await requireHost();
  const data = await getHostData(user.id);
  const { listings, pending, bookings, threads, unreadMessages } = data;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = now.getFullYear();
  const month = now.getMonth();

  const firstName = (user.name || "there").split(" ")[0];
  const subtitle =
    listings.length === 1 ? listings[0].name : `${listings.length} listings · Earthy Stays`;

  /* ---- stat cards ---- */
  const checkInsToday = bookings.filter((b) => dayKey(b.checkIn) === dayKey(today));
  const stayingTonight = bookings.filter((b) => occupiesNight(b, today));
  const guestsStaying = stayingTonight.reduce((n, b) => n + (b.inquiry.guests ?? 0), 0);

  const upcomingCheckouts = bookings
    .filter((b) => b.checkOut >= today)
    .sort((a, b) => a.checkOut.getTime() - b.checkOut.getTime());
  const payoutDate = upcomingCheckouts[0]?.checkOut;
  const payoutWindowEnd = payoutDate ? addDays(payoutDate, 7) : undefined;
  const payoutAmount = payoutDate
    ? upcomingCheckouts
        .filter((b) => b.checkOut <= payoutWindowEnd!)
        .reduce((n, b) => n + b.amount, 0)
    : 0;

  /* ---- earnings + occupancy ---- */
  const monthBookings = bookingsForMonth(bookings, year, month);
  const daily = dailyRevenue(monthBookings, year, month);
  const monthTotal = daily.reduce((a, b) => a + b, 0);
  const prev = new Date(year, month - 1, 1);
  const prevTotal = dailyRevenue(
    bookingsForMonth(bookings, prev.getFullYear(), prev.getMonth()),
    prev.getFullYear(),
    prev.getMonth(),
  ).reduce((a, b) => a + b, 0);
  const earningsDelta = prevTotal > 0 ? Math.round(((monthTotal - prevTotal) / prevTotal) * 100) : null;

  const occ = occupancyPct(listings, bookings, data.blockedBySlug, year, month);
  const occPrev = occupancyPct(
    listings,
    bookings,
    data.blockedBySlug,
    prev.getFullYear(),
    prev.getMonth(),
  );

  /* ---- upcoming ---- */
  const upcoming = bookings.filter((b) => b.checkIn >= today).slice(0, 3);

  /* ---- smart suggestion (simple heuristic) ---- */
  const avgPrice = Math.round(
    listings.reduce((n, l) => n + l.pricePerNight, 0) / Math.max(listings.length, 1),
  );
  const suggestionExtra = Math.round((avgPrice * 0.12 * 8) / 100) * 100; // 12% on ~8 weekend nights

  /* ---- today's tasks ---- */
  const unreadThreads = threads.filter((t) => unreadCount(t, "host") > 0);
  const unreadNames = await Promise.all(
    unreadThreads.slice(0, 3).map(async (t) => (await findUserById(t.guestUserId))?.name ?? "a guest"),
  );
  const tasks: string[] = [
    ...checkInsToday.map((b) => `Guest check-in — ${b.inquiry.name} at 2:00 PM`),
    ...bookings
      .filter((b) => dayKey(b.checkOut) === dayKey(today))
      .map((b) => `Check-out — ${b.inquiry.name} at 11:00 AM`),
    ...unreadNames.map((n) => `Reply to ${n}`),
    ...pending.slice(0, 2).map((q) => `Respond to ${q.name}'s booking request`),
  ];

  /* ---- recent activity ---- */
  type Activity = { icon: "msg" | "booking" | "request"; title: string; sub?: string; at: string };
  const activity: Activity[] = [];
  for (const t of threads) {
    const last = t.messages[t.messages.length - 1];
    if (last?.sender === "guest") {
      const guest = await findUserById(t.guestUserId);
      activity.push({
        icon: "msg",
        title: `New message from ${guest?.name ?? "a guest"}`,
        sub: last.body.length > 46 ? `${last.body.slice(0, 46)}…` : last.body,
        at: last.at,
      });
    }
  }
  for (const b of bookings) {
    if (!b.inquiry.updatedAt) continue;
    activity.push({
      icon: "booking",
      title: `Booking accepted for ${fmtShort(b.checkIn)} – ${fmtShort(b.checkOut)}`,
      sub: b.inquiry.name,
      at: b.inquiry.updatedAt,
    });
  }
  for (const q of pending) {
    activity.push({ icon: "request", title: `New booking request`, sub: q.name, at: q.createdAt });
  }
  activity.sort((a, b) => (a.at < b.at ? 1 : -1));

  /* ---- week strip ---- */
  const weekStart = addDays(today, -((today.getDay() + 6) % 7)); // Monday
  const week = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const blockedAll = new Set(
    Object.entries(data.blockedBySlug).flatMap(([slug, days]) => days.map((d) => `${slug}|${d}`)),
  );

  const statCards = [
    { icon: CalendarCheck2, label: "Today's check-ins", value: String(checkInsToday.length), href: "/host/bookings", cta: "View details" },
    { icon: Users, label: "Guests staying", value: String(guestsStaying), href: "/host/bookings", cta: "View details" },
    { icon: Clock3, label: "Pending requests", value: String(pending.length), href: "/host/bookings", cta: "View requests" },
    { icon: MessageSquare, label: "Unread messages", value: String(unreadMessages), href: "/host/inbox", cta: "Go to inbox" },
    { icon: Wallet, label: "Next payout", value: payoutAmount > 0 ? formatINR(payoutAmount) : "—", sub: payoutDate ? payoutDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : undefined, href: "/host/payouts", cta: "View payouts" },
  ];

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8 lg:px-8">
      {/* header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[28px]">
            {greeting()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-[15px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-background">
            <Bell className="h-[18px] w-[18px] text-muted-foreground" strokeWidth={1.8} />
            {(unreadMessages > 0 || pending.length > 0) && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </span>
          <span className="hidden items-center gap-2 rounded-full border border-border/70 bg-background px-4 py-2 text-sm font-medium sm:flex">
            Earthy Concierge
          </span>
        </div>
      </div>

      {/* stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border/60 bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <s.icon className="h-4 w-4" strokeWidth={1.8} />
              <span className="text-[13px]">{s.label}</span>
            </div>
            <p className={`mt-2 font-semibold tracking-tight ${s.value.length > 4 ? "text-xl" : "text-3xl"}`}>{s.value}</p>
            {s.sub && <p className="mt-0.5 text-xs text-muted-foreground">{s.sub}</p>}
            <Link href={s.href} className="mt-2 inline-flex items-center gap-0.5 text-[13px] font-medium text-foreground/80 hover:text-foreground">
              {s.cta} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>

      {/* main grid */}
      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* left column */}
        <div className="space-y-5 xl:col-span-8">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.6fr_1fr]">
            {/* earnings */}
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-[15px] font-semibold">Earnings overview</h2>
                <span className="rounded-full border border-border/70 px-3 py-1 text-xs text-muted-foreground">This month</span>
              </div>
              <div className="mt-3 flex items-baseline gap-3">
                <p className="text-3xl font-semibold tracking-tight">{formatINR(monthTotal)}</p>
                {earningsDelta !== null && (
                  <p className={`text-sm font-medium ${earningsDelta >= 0 ? "text-emerald-700" : "text-destructive"}`}>
                    {earningsDelta >= 0 ? "↑" : "↓"} {Math.abs(earningsDelta)}% vs last month
                  </p>
                )}
              </div>
              <EarningsChart daily={daily} />
            </div>

            {/* occupancy */}
            <div className="rounded-2xl border border-border/60 bg-background p-5">
              <h2 className="text-[15px] font-semibold">Occupancy rate</h2>
              <div className="mt-4">
                <OccupancyDonut pct={occ} delta={occ - occPrev} />
              </div>
            </div>
          </div>

          {/* smart suggestion */}
          <div className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background p-5 sm:flex-row sm:items-center">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-semibold">Smart suggestion</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Weekend demand is high. Increase your Friday &amp; Saturday price by 12% to earn an
                estimated extra <span className="font-semibold text-foreground">{formatINR(suggestionExtra)}</span>.
              </p>
            </div>
            <Link
              href="/host/listings"
              className="shrink-0 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Review suggestion
            </Link>
          </div>

          {/* week calendar strip */}
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Calendar</h2>
              <Link href="/host/calendar" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-foreground/80 hover:text-foreground">
                Full calendar <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-7 overflow-hidden rounded-xl border border-border/60">
              {week.map((day) => {
                const isToday = dayKey(day) === dayKey(today);
                const dayBookings = bookings.filter((b) => occupiesNight(b, day));
                const blockedListings = listings.filter((l) => blockedAll.has(`${l.slug}|${dayKey(day)}`));
                return (
                  <div key={dayKey(day)} className="min-h-[110px] border-r border-border/60 last:border-r-0">
                    <div className="flex flex-col items-center gap-1 px-1 pt-2.5">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                        {day.toLocaleDateString("en-IN", { weekday: "short" })}
                      </span>
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                          isToday ? "bg-primary font-semibold text-primary-foreground" : "font-medium"
                        }`}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    <div className="space-y-1 px-1.5 py-2">
                      {dayBookings.slice(0, 2).map((b) => (
                        <div key={b.inquiry.id} className="rounded-md bg-primary/10 px-1.5 py-1">
                          <p className="truncate text-[10.5px] font-medium leading-tight">{b.inquiry.name}</p>
                          <p className="text-[10px] text-muted-foreground">{formatINR(b.villa.pricePerNight)}</p>
                        </div>
                      ))}
                      {blockedListings.length > 0 && (
                        <div className="rounded-md bg-muted px-1.5 py-1">
                          <p className="text-[10.5px] font-medium leading-tight text-muted-foreground">Blocked</p>
                        </div>
                      )}
                      {dayBookings.length === 0 && blockedListings.length === 0 && (
                        <p className="pt-2 text-center text-xs text-muted-foreground/50">—</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* right rail */}
        <div className="space-y-5 xl:col-span-4">
          {/* upcoming */}
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">Upcoming</h2>
              <Link href="/host/bookings" className="inline-flex items-center gap-0.5 text-[13px] font-medium text-foreground/80 hover:text-foreground">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">No upcoming stays yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {upcoming.map((b) => (
                  <UpcomingRow key={b.inquiry.id} b={b} />
                ))}
              </ul>
            )}
          </div>

          {/* today's tasks */}
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-[15px] font-semibold">Today&apos;s tasks</h2>
            <TasksChecklist tasks={tasks} />
          </div>

          {/* recent activity */}
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <h2 className="text-[15px] font-semibold">Recent activity</h2>
            {activity.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">Activity from guests appears here.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {activity.slice(0, 4).map((a, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted/70">
                      {a.icon === "msg" ? (
                        <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : a.icon === "booking" ? (
                        <CalendarCheck2 className="h-3.5 w-3.5 text-muted-foreground" />
                      ) : (
                        <Clock3 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{a.title}</p>
                      {a.sub && <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{a.sub}</p>}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingRow({ b }: { b: HostBooking }) {
  const img = b.villa.images[0];
  return (
    <li className="flex items-center gap-3">
      <div className="relative h-12 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
        {img && <Image src={img.src} alt={img.alt ?? b.villa.name} fill sizes="56px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{b.inquiry.name}</p>
        <p className="text-[13px] text-muted-foreground">
          {b.inquiry.guests ?? "—"} guests · Direct
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-medium">{fmtShort(b.checkIn)}</p>
        <p className="text-xs text-muted-foreground">Check-in 2:00 PM</p>
      </div>
      <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
        Confirmed
      </span>
    </li>
  );
}
