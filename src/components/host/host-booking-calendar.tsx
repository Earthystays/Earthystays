"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Lock,
  MessageSquare,
  StickyNote,
  Tag,
  X,
} from "lucide-react";
import { toggleDate } from "@/app/host/(dash)/calendar/actions";
import { formatINR } from "@/lib/format";

export type CalBooking = {
  id: string;
  guest: string;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guests?: number;
  price: number;
  nights: number;
  amount: number;
  status: "confirmed" | "tentative";
  threadId?: string;
};

export type ExternalBusy = {
  start: string; // YYYY-MM-DD first busy night
  end: string; // YYYY-MM-DD checkout day (exclusive)
  sourceName: string;
};

type Filter = "all" | "confirmed" | "tentative" | "blocked" | "synced";

const FILTERS: Array<{ id: Filter; label: string; dot?: string }> = [
  { id: "all", label: "All" },
  { id: "confirmed", label: "Confirmed", dot: "bg-primary" },
  { id: "tentative", label: "Tentative", dot: "bg-amber-400" },
  { id: "blocked", label: "Blocked", dot: "bg-muted-foreground/50" },
  { id: "synced", label: "Synced", dot: "bg-violet-400" },
];

function parseDay(s: string): Date {
  return new Date(`${s}T00:00:00`);
}

function key(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function occupies(b: CalBooking, day: Date): boolean {
  return parseDay(b.checkIn) <= day && day < parseDay(b.checkOut);
}

export function HostBookingCalendar({
  slug,
  bookings,
  blockedDates,
  external = [],
}: {
  slug: string;
  bookings: CalBooking[];
  blockedDates: string[];
  external?: ExternalBusy[];
}) {
  const router = useRouter();
  const today = useMemo(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  }, []);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [filter, setFilter] = useState<Filter>("all");
  const [blocked, setBlocked] = useState<Set<string>>(() => new Set(blockedDates));
  const [selectedDay, setSelectedDay] = useState<Date | null>(today);
  const [blockPending, startBlock] = useTransition();
  const [blockError, setBlockError] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthTitle = cursor.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  /* Grid: Monday-first, 6 weeks. */
  const cells = useMemo(() => {
    const first = new Date(year, month, 1);
    const lead = (first.getDay() + 6) % 7;
    const start = new Date(year, month, 1 - lead);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [year, month]);

  const show = (kind: "confirmed" | "tentative" | "blocked" | "synced") =>
    filter === "all" || filter === kind;

  const dayInfo = (day: Date) => {
    const k = key(day);
    const stays = bookings.filter((b) => occupies(b, day));
    return {
      confirmed: stays.filter((b) => b.status === "confirmed"),
      tentative: stays.filter((b) => b.status === "tentative"),
      isBlocked: blocked.has(k),
      synced: external.filter((e) => e.start <= k && k < e.end),
    };
  };

  const sel = selectedDay ? dayInfo(selectedDay) : null;
  const selBooking = sel?.confirmed[0] ?? sel?.tentative[0] ?? null;

  function toggleBlock(day: Date) {
    const k = key(day);
    setBlockError(null);
    startBlock(async () => {
      const res = await toggleDate(slug, k);
      if (!res.ok) {
        setBlockError(res.error ?? "Couldn't update the date");
        return;
      }
      setBlocked((prev) => {
        const next = new Set(prev);
        if (res.blocked) next.add(k);
        else next.delete(k);
        return next;
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-5 xl:flex-row">
      {/* ── month grid ────────────────────────────────────── */}
      <div className="min-w-0 flex-1 rounded-2xl border border-border/60 bg-background">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto rounded-full border border-border/60 p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium ${
                  filter === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f.dot && <span className={`h-1.5 w-1.5 rounded-full ${filter === f.id ? "bg-background" : f.dot}`} />}
                {f.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted/50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[130px] text-center text-[15px] font-semibold">{monthTitle}</span>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted/50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
                setSelectedDay(today);
              }}
              className="rounded-full border border-border px-3.5 py-1.5 text-[13px] font-medium hover:bg-muted/50"
            >
              Today
            </button>
          </div>
        </div>

        {/* weekday header */}
        <div className="grid grid-cols-7 border-b border-border/60 text-center">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
            <div key={d} className="py-2 text-[11px] font-medium tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>

        {/* cells */}
        <div className="grid grid-cols-7">
          {cells.map((day) => {
            const inMonth = day.getMonth() === month;
            const isToday = key(day) === key(today);
            const isSelected = selectedDay && key(day) === key(selectedDay);
            const info = dayInfo(day);
            return (
              <button
                key={key(day)}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`min-h-[92px] border-b border-r border-border/40 p-1.5 text-left align-top transition-colors [&:nth-child(7n)]:border-r-0 ${
                  inMonth ? "" : "bg-muted/20"
                } ${isSelected ? "bg-primary/5" : "hover:bg-muted/30"}`}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[13px] ${
                    isToday
                      ? "bg-primary font-semibold text-primary-foreground"
                      : inMonth
                        ? "font-medium"
                        : "text-muted-foreground/60"
                  }`}
                >
                  {day.getDate()}
                </span>
                <div className="mt-1 space-y-1">
                  {show("confirmed") &&
                    info.confirmed.slice(0, 1).map((b) => (
                      <div key={b.id} className="rounded-md bg-primary/10 px-1.5 py-1">
                        <p className="truncate text-[10.5px] font-medium leading-tight">{b.guest}</p>
                        <p className="text-[10px] text-muted-foreground">{formatINR(b.price)}</p>
                        {key(day) === b.checkIn && <p className="text-[9.5px] font-medium text-primary">Check-in</p>}
                        {key(parseDay(b.checkOut)) === key(new Date(day.getTime() + 864e5)) && (
                          <p className="text-[9.5px] text-muted-foreground">Last night</p>
                        )}
                      </div>
                    ))}
                  {show("tentative") &&
                    info.tentative.slice(0, 1).map((b) => (
                      <div key={b.id} className="rounded-md bg-amber-50 px-1.5 py-1">
                        <p className="truncate text-[10.5px] font-medium leading-tight text-amber-800">Tentative</p>
                        <p className="text-[10px] text-amber-700/80">{b.nights} nights</p>
                      </div>
                    ))}
                  {show("blocked") && info.isBlocked && (
                    <div className="flex items-center gap-1 rounded-md bg-muted px-1.5 py-1">
                      <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                      <p className="text-[10.5px] font-medium text-muted-foreground">Blocked</p>
                    </div>
                  )}
                  {show("synced") &&
                    info.synced.slice(0, 1).map((e, i) => (
                      <div key={`${e.sourceName}-${i}`} className="rounded-md bg-violet-50 px-1.5 py-1">
                        <p className="truncate text-[10.5px] font-medium leading-tight text-violet-800">{e.sourceName}</p>
                        <p className="text-[10px] text-violet-700/70">Synced</p>
                      </div>
                    ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* legend */}
        <div className="flex flex-wrap items-center gap-5 px-4 py-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary" /> Direct booking</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Tentative request</span>
          <span className="flex items-center gap-1.5"><Lock className="h-3 w-3" /> Blocked</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" /> Synced from other platforms</span>
        </div>
      </div>

      {/* ── day panel ─────────────────────────────────────── */}
      {selectedDay && (
        <div className="w-full shrink-0 xl:w-[300px]">
          <div className="rounded-2xl border border-border/60 bg-background p-5">
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-[17px] font-semibold">
                {selectedDay.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </h2>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                aria-label="Close day panel"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {selBooking ? (
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Booking</p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                      selBooking.status === "confirmed"
                        ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border border-amber-200 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {selBooking.status === "confirmed" ? "Confirmed" : "Tentative"}
                  </span>
                </div>
                <p className="mt-3 text-[15px] font-semibold">{selBooking.guest}</p>
                {selBooking.guests && (
                  <p className="text-[13px] text-muted-foreground">{selBooking.guests} guests</p>
                )}
                <dl className="mt-4 space-y-2 text-[13.5px]">
                  <div className="flex justify-between"><dt className="text-muted-foreground">Check-in</dt><dd className="font-medium">{parseDay(selBooking.checkIn).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, 2:00 PM</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Check-out</dt><dd className="font-medium">{parseDay(selBooking.checkOut).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}, 11:00 AM</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium">{selBooking.nights} night{selBooking.nights === 1 ? "" : "s"}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Total amount</dt><dd className="font-medium">{formatINR(selBooking.amount)}</dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Payment</dt><dd><span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Concierge settles</span></dd></div>
                  <div className="flex justify-between"><dt className="text-muted-foreground">Booking ID</dt><dd className="font-medium">{selBooking.id.replace(/^inq_/, "").slice(0, 10).toUpperCase()}</dd></div>
                </dl>
                <Link
                  href="/host/bookings"
                  className="mt-4 block rounded-lg border border-border px-4 py-2 text-center text-sm font-medium hover:bg-muted/50"
                >
                  View booking details
                </Link>
              </div>
            ) : sel && sel.synced.length > 0 ? (
              <div className="mt-4 rounded-lg bg-violet-50 px-3.5 py-3">
                <p className="text-sm font-medium text-violet-900">
                  Booked on {sel.synced[0].sourceName}
                </p>
                <p className="mt-1 text-[13px] text-violet-800/80">
                  Synced from that platform&apos;s calendar — manage the reservation there.
                </p>
              </div>
            ) : sel?.isBlocked ? (
              <p className="mt-4 rounded-lg bg-muted/50 px-3.5 py-3 text-sm text-muted-foreground">
                This night is blocked — guests can&apos;t request it.
              </p>
            ) : (
              <p className="mt-4 rounded-lg bg-muted/40 px-3.5 py-3 text-sm text-muted-foreground">
                Nothing scheduled. Block the night or adjust pricing below.
              </p>
            )}

            {/* quick actions */}
            <p className="mt-6 text-sm font-semibold">Quick actions</p>
            {blockError && <p className="mt-2 text-[13px] text-destructive">{blockError}</p>}
            <div className="mt-2.5 space-y-1.5">
              <Link
                href={selBooking?.threadId ? `/host/inbox?thread=${selBooking.threadId}` : "/host/inbox"}
                className="flex items-center gap-2.5 rounded-lg border border-border/70 px-3.5 py-2.5 text-[13.5px] font-medium hover:bg-muted/40"
              >
                <MessageSquare className="h-4 w-4 text-muted-foreground" /> Send message
              </Link>
              <button
                type="button"
                disabled={blockPending || !!selBooking}
                onClick={() => toggleBlock(selectedDay)}
                title={selBooking ? "Booked nights can't be blocked" : undefined}
                className="flex w-full items-center gap-2.5 rounded-lg border border-border/70 px-3.5 py-2.5 text-[13.5px] font-medium hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {blockPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground" />
                )}
                {sel?.isBlocked ? "Unblock this night" : "Block this night"}
              </button>
              <Link
                href={`/host/listings/${slug}/edit`}
                className="flex items-center gap-2.5 rounded-lg border border-border/70 px-3.5 py-2.5 text-[13.5px] font-medium hover:bg-muted/40"
              >
                <Tag className="h-4 w-4 text-muted-foreground" /> Change price
              </Link>
              <span className="flex items-center gap-2.5 rounded-lg border border-dashed border-border/70 px-3.5 py-2.5 text-[13.5px] text-muted-foreground">
                <StickyNote className="h-4 w-4" /> Add note — coming soon
              </span>
            </div>
          </div>

          <Link
            href="/host/bookings"
            className="mt-4 flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background px-4 py-3 text-sm font-medium hover:bg-muted/40"
          >
            <CalendarPlus className="h-4 w-4" /> View all bookings
          </Link>
        </div>
      )}
    </div>
  );
}
