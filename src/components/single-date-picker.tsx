"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Single-date picker — one calendar, one date. Used in pairs for
 * check-in / check-out so each field has its own clean popover.
 *
 * On mobile the popover anchors to the trigger's row (full-width),
 * on desktop it centres under the trigger.
 */
export function SingleDatePicker({
  label,
  placeholder = "Select Date",
  value,
  onChange,
  minDate,
  className = "",
}: {
  label: string;
  placeholder?: string;
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  /** Disable dates before this (e.g. for check-out: must be ≥ check-in + 1) */
  minDate?: Date;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const el = popoverRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const disabled = minDate
    ? { before: minDate > today ? minDate : today }
    : { before: today };

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2.5 px-5 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <Calendar className="mt-1 h-4 w-4 shrink-0 text-terracotta" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </span>
          <span
            className={`block text-[15px] ${
              value ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {value ? format(value, "d MMM") : placeholder}
          </span>
        </span>
      </button>

      {open && (
        <div
          className="
            rdp-popover absolute top-full z-50 mt-3 rounded-2xl border border-border/60 bg-card shadow-2xl
            left-0 right-0 w-auto
            sm:left-1/2 sm:right-auto sm:w-max sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2
          "
        >
          <div className="p-3 sm:p-5">
            <DayPicker
              mode="single"
              weekStartsOn={1}
              selected={value}
              onSelect={(d) => {
                onChange(d);
                if (d) setOpen(false);
              }}
              disabled={disabled}
              modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
              modifiersClassNames={{ weekend: "rdp-weekend" }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  ),
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
