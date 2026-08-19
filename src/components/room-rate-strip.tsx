"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { effectiveUnitPrice, effectiveUnitUnits } from "@/lib/data/units";
import type { AccommodationUnit } from "@/lib/types";
import type { UnitDateMap } from "@/lib/data/unit-rates";

const WD = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MO = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** UTC "YYYY-MM-DD" for today + `offset` days. */
function isoOffset(offset: number): string {
  const now = new Date();
  const base = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return new Date(base + offset * 86400000).toISOString().slice(0, 10);
}

/**
 * 7-day price + inventory strip under a room/dorm card (calendar — Phase 21).
 * Reads per-date overrides (price / units) with fallback to the unit's
 * base/weekend price and pooled inventory; blocked dates show as unavailable.
 * Navigate week-by-week with the arrows.
 */
export function RoomRateStrip({
  unit,
  overrides = {},
  blocked = [],
  noun,
}: {
  unit: AccommodationUnit;
  overrides?: UnitDateMap;
  blocked?: string[];
  /** "Room" | "Bed" — label for the inventory count. */
  noun: string;
}) {
  const [week, setWeek] = useState(0);
  const blockedSet = new Set(blocked);
  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = isoOffset(week * 7 + i);
    const d = new Date(`${iso}T00:00:00Z`);
    const price = effectiveUnitPrice(unit, iso, overrides[iso]);
    const units = effectiveUnitUnits(unit, iso, overrides[iso], blockedSet);
    return {
      iso,
      weekday: WD[d.getUTCDay()],
      label: `${d.getUTCDate()} ${MO[d.getUTCMonth()]}`,
      price,
      units,
    };
  });

  return (
    <div className="mt-3 flex items-stretch gap-2 border-t border-border/60 pt-3">
      <button
        type="button"
        onClick={() => setWeek((w) => Math.max(0, w - 1))}
        disabled={week === 0}
        className="grid w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground disabled:opacity-30 hover:bg-muted"
        aria-label="Previous week"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto sm:grid sm:grid-cols-7">
        {days.map((d) => (
          <div
            key={d.iso}
            className={`flex min-w-[4.5rem] flex-1 flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center ${
              d.units > 0 ? "border-border/60 bg-card" : "border-border/40 bg-muted/50"
            }`}
          >
            <p className="whitespace-nowrap text-xs leading-tight text-muted-foreground">
              {d.weekday}
            </p>
            <p className="whitespace-nowrap text-xs font-medium leading-tight text-foreground">
              {d.label}
            </p>
            {d.units > 0 ? (
              <>
                <p className="mt-1.5 whitespace-nowrap text-lg font-bold leading-tight text-primary tabular-nums">
                  ₹{d.price.toLocaleString("en-IN")}
                </p>
                <p className="whitespace-nowrap text-[11px] leading-tight text-muted-foreground">
                  {d.units} {noun.toLowerCase()}
                  {d.units === 1 ? "" : "s"}
                </p>
              </>
            ) : (
              <p className="mt-1.5 whitespace-nowrap text-[11px] font-medium leading-tight text-muted-foreground">
                Sold out
              </p>
            )}
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setWeek((w) => w + 1)}
        className="grid w-8 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        aria-label="Next week"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
