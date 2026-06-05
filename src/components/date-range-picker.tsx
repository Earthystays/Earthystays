"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker, type DateRange } from "react-day-picker";
import "react-day-picker/style.css";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type { DateRange };

type Props = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
};

export function DateRangePicker({ value, onChange, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Prime the draft range when the popover opens — same pattern as guests-picker.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: prime local draft from parent value on open
    if (open) setDraft(value);
  }, [open, value]);

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

  function apply() {
    onChange(draft);
    setOpen(false);
  }

  function clear() {
    setDraft(undefined);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      <div className="grid grid-cols-2 divide-x divide-border/60">
        <FieldButton
          label="Check-in"
          placeholder="Select Date"
          value={value?.from ? format(value.from, "d MMM") : ""}
          onClick={() => setOpen((o) => !o)}
        />
        <FieldButton
          label="Check-out"
          placeholder="Select Date"
          value={value?.to ? format(value.to, "d MMM") : ""}
          onClick={() => setOpen((o) => !o)}
        />
      </div>

      {open && (
        <div className="rdp-popover absolute left-1/2 top-full z-50 mt-3 w-max max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-2xl border border-border/60 bg-card shadow-2xl">
          <div className="p-4 sm:p-5">
            <DayPicker
              mode="range"
              numberOfMonths={2}
              weekStartsOn={1}
              selected={draft}
              onSelect={setDraft}
              disabled={{ before: today }}
              modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
              modifiersClassNames={{ weekend: "rdp-weekend" }}
              classNames={{
                // Keep the default rdp classes for everything else — we only
                // change the months direction so the two months sit side-by-side.
                months: "rdp-months flex flex-row flex-nowrap gap-8",
              }}
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

          <div className="flex items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-3">
            <div className="text-xs text-muted-foreground">
              {draft?.from && draft?.to ? (
                <>
                  {format(draft.from, "d MMM")} – {format(draft.to, "d MMM")} ·{" "}
                  {nightsBetween(draft.from, draft.to)} night
                  {nightsBetween(draft.from, draft.to) === 1 ? "" : "s"}
                </>
              ) : draft?.from ? (
                <>From {format(draft.from, "d MMM")} — pick check-out</>
              ) : (
                <>Tap a date to start</>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clear}
                className="text-xs text-muted-foreground hover:text-foreground"
                disabled={!draft?.from}
              >
                Clear
              </button>
              <Button
                onClick={apply}
                className="rounded-md px-8 text-sm font-bold uppercase tracking-wide"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldButton({
  label,
  placeholder,
  value,
  onClick,
}: {
  label: string;
  placeholder: string;
  value: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start gap-2.5 px-5 py-2.5 text-left transition-colors hover:bg-muted/40"
    >
      <Calendar className="mt-1 h-4 w-4 shrink-0 text-terracotta" />
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </span>
        <span className={`block text-[15px] ${value ? "text-foreground" : "text-muted-foreground"}`}>
          {value || placeholder}
        </span>
      </span>
    </button>
  );
}

function nightsBetween(a: Date, b: Date): number {
  const ms = b.getTime() - a.getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}
