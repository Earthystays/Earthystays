"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, ChevronDown } from "lucide-react";

const PRESETS = [
  { value: "month", label: "This month" },
  { value: "7", label: "Last 7 days" },
  { value: "15", label: "Last 15 days" },
  { value: "30", label: "Last 30 days" },
] as const;

/**
 * The date pill on the admin overview. Opens a dropdown with preset
 * ranges (this month / last 7 / 15 / 30 days) plus a custom from–to
 * picker. Selection is written to the URL (`?range=…` or
 * `?range=custom&from=…&to=…`) so the server component re-renders the
 * dashboard scoped to that window.
 */
export function DateRangeFilter({
  range,
  from,
  to,
  label,
}: {
  range: string;
  from?: string;
  to?: string;
  label: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(from ?? "");
  const [customTo, setCustomTo] = useState(to ?? "");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  function go(query: string) {
    router.push(`/admin${query ? `?${query}` : ""}`);
    setOpen(false);
  }

  const today = new Date().toISOString().slice(0, 10);
  const customValid =
    customFrom !== "" && customTo !== "" && customFrom <= customTo;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full border border-[hsl(38_18%_88%)] bg-white px-4 py-2 text-sm text-[#4A4235] hover:bg-[hsl(38_30%_93%)]"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Calendar className="h-4 w-4 text-[#8A8072]" strokeWidth={1.7} />
        {label}
        <ChevronDown
          className={`h-4 w-4 text-[#8A8072] transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.7}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-[hsl(38_18%_88%)] bg-white p-2 shadow-lg">
          <ul>
            {PRESETS.map((p) => {
              const active = range === p.value;
              return (
                <li key={p.value}>
                  <button
                    type="button"
                    onClick={() =>
                      go(p.value === "month" ? "" : `range=${p.value}`)
                    }
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-[hsl(38_30%_93%)] ${
                      active
                        ? "font-medium text-[#2A2A2A]"
                        : "text-[#4A4235]"
                    }`}
                  >
                    {p.label}
                    {active && (
                      <Check className="h-4 w-4 text-[#5D7050]" strokeWidth={2} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-1 border-t border-[hsl(38_18%_92%)] px-3 pb-2 pt-3">
            <p className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-[#8A8072]">
              Custom range
              {range === "custom" && (
                <Check className="h-4 w-4 text-[#5D7050]" strokeWidth={2} />
              )}
            </p>
            <div className="mt-2 space-y-2">
              <label className="block text-xs text-[#8A8072]">
                From
                <input
                  type="date"
                  value={customFrom}
                  max={customTo || today}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[hsl(38_18%_88%)] bg-white px-2.5 py-1.5 text-sm text-[#2A2A2A] outline-none focus:border-[#8A8072]"
                />
              </label>
              <label className="block text-xs text-[#8A8072]">
                To
                <input
                  type="date"
                  value={customTo}
                  min={customFrom || undefined}
                  max={today}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[hsl(38_18%_88%)] bg-white px-2.5 py-1.5 text-sm text-[#2A2A2A] outline-none focus:border-[#8A8072]"
                />
              </label>
              <button
                type="button"
                disabled={!customValid}
                onClick={() =>
                  go(`range=custom&from=${customFrom}&to=${customTo}`)
                }
                className="w-full rounded-full bg-[#2A2A2A] px-3 py-2 text-xs font-medium text-white hover:bg-[#4A4235] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
