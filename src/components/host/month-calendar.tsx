"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { toggleDate } from "@/app/host/(dash)/calendar/actions";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function iso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function MonthCalendar({
  slug,
  initialBlocked,
  pricePerNight,
}: {
  slug: string;
  initialBlocked: string[];
  pricePerNight: number;
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [blocked, setBlocked] = useState<Set<string>>(new Set(initialBlocked));
  const [, startTransition] = useTransition();

  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (first.getDay() + 6) % 7; // Monday-first
  const todayIso = iso(today.getFullYear(), today.getMonth(), today.getDate());

  function nav(delta: number) {
    const next = new Date(year, month + delta, 1);
    setYear(next.getFullYear());
    setMonth(next.getMonth());
  }

  function onToggle(date: string) {
    if (date < todayIso) return; // the past can't be edited
    // Optimistic: flip locally, reconcile if the server disagrees.
    setBlocked((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
    startTransition(async () => {
      const res = await toggleDate(slug, date);
      if (!res.ok) {
        setBlocked((prev) => {
          const next = new Set(prev);
          if (next.has(date)) next.delete(date);
          else next.add(date);
          return next;
        });
        alert(res.error ?? "Couldn't update that date");
      }
    });
  }

  const price =
    pricePerNight >= 1000
      ? `₹${(pricePerNight / 1000).toFixed(pricePerNight % 1000 === 0 ? 0 : 1)}k`
      : `₹${pricePerNight}`;

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">
          {MONTHS[month]} {year}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => nav(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted/50"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => nav(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border hover:bg-muted/50"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {DOW.map((d) => (
          <div key={d} className="pb-1 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {d}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const d = i + 1;
          const date = iso(year, month, d);
          const isBlocked = blocked.has(date);
          const isPast = date < todayIso;
          const isToday = date === todayIso;
          return (
            <button
              key={date}
              type="button"
              onClick={() => onToggle(date)}
              disabled={isPast}
              aria-pressed={isBlocked}
              aria-label={`${date}${isBlocked ? " — blocked" : " — open"}`}
              className={`flex aspect-square flex-col items-start justify-between rounded-lg border p-1.5 text-left text-sm transition-colors sm:aspect-[1.3] sm:p-2 ${
                isPast
                  ? "cursor-default border-transparent text-muted-foreground/40"
                  : isBlocked
                    ? "border-border bg-muted text-muted-foreground"
                    : "border-border hover:border-foreground/50"
              }`}
            >
              <span className={`text-[13px] leading-none ${isToday ? "flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground" : isBlocked ? "line-through" : "font-medium"}`}>
                {d}
              </span>
              {!isPast && (
                <span className="hidden text-[11px] text-muted-foreground sm:block">
                  {isBlocked ? "Blocked" : price}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Click a date to block or open it. Blocked dates are struck through — guests can
        still send requests for open dates, and you approve each one.
      </p>
    </div>
  );
}
