"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus, Users as UsersIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Guests = {
  adults: number;
  children: number;
  infants: number;
  rooms: number;
};

export const DEFAULT_GUESTS: Guests = {
  adults: 2,
  children: 0,
  infants: 0,
  rooms: 1,
};

type Props = {
  value: Guests;
  onChange: (g: Guests) => void;
  /** Called when the user hits "Apply & Search". Receives the chosen Guests
   *  directly so callers don't have to wait for state to update. */
  onApplyAndSearch?: (g: Guests) => void;
  className?: string;
};

export function GuestsPicker({ value, onChange, onApplyAndSearch, className = "" }: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Guests>(value);
  const ref = useRef<HTMLDivElement>(null);

  // Prime draft from current value when the popover opens.
  // `open` is an external trigger (parent controls it) so the effect is the
  // right tool here — we can't derive this purely in render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: prime local draft from parent value on open
    if (open) setDraft(value);
  }, [open, value]);

  // Click outside to close (no apply)
  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      const el = ref.current;
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

  function clear() {
    setDraft(DEFAULT_GUESTS);
  }

  function applyAndSearch() {
    onChange(draft);
    setOpen(false);
    onApplyAndSearch?.(draft);
  }

  function set<K extends keyof Guests>(key: K, mutator: (n: number) => number) {
    setDraft((d) => ({ ...d, [key]: mutator(d[key]) }));
  }

  // Trigger summary — Total people (excluding infants per industry norm)
  const totalPeople = value.adults + value.children;
  const summary = `${totalPeople} Guest${totalPeople === 1 ? "" : "s"}, ${value.rooms}+ Room${value.rooms === 1 ? "" : "s"}`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-2.5 px-5 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <UsersIcon className="mt-1 h-4 w-4 shrink-0 text-terracotta" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Guests
          </span>
          <span className="block text-[15px] text-foreground">{summary}</span>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
          <div className="grid divide-y divide-border/60">
            <StepperRow
              title="Adults"
              hint="Age 13 years and more"
              value={draft.adults}
              min={1}
              max={30}
              format={(n) => String(n).padStart(2, "0")}
              onMinus={() => set("adults", (n) => Math.max(1, n - 1))}
              onPlus={() => set("adults", (n) => Math.min(30, n + 1))}
            />
            <StepperRow
              title="Children"
              hint="Age 3-12 years"
              value={draft.children}
              min={0}
              max={20}
              format={(n) => String(n).padStart(2, "0")}
              onMinus={() => set("children", (n) => Math.max(0, n - 1))}
              onPlus={() => set("children", (n) => Math.min(20, n + 1))}
            />
            <StepperRow
              title="Infants"
              hint="Age 0-2 years"
              value={draft.infants}
              min={0}
              max={10}
              format={(n) => String(n).padStart(2, "0")}
              onMinus={() => set("infants", (n) => Math.max(0, n - 1))}
              onPlus={() => set("infants", (n) => Math.min(10, n + 1))}
            />
            <StepperRow
              title="Rooms"
              value={draft.rooms}
              min={1}
              max={20}
              format={(n) => `${n}+`}
              onMinus={() => set("rooms", (n) => Math.max(1, n - 1))}
              onPlus={() => set("rooms", (n) => Math.min(20, n + 1))}
            />
          </div>
          <div className="flex items-center gap-3 border-t border-border/60 bg-muted/30 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              className="h-11 flex-1 justify-center rounded-md text-sm font-bold uppercase tracking-wide"
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={applyAndSearch}
              className="h-11 flex-1 justify-center rounded-md bg-foreground text-background hover:bg-foreground/90 text-sm font-bold uppercase tracking-wide"
            >
              Apply & Search
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepperRow({
  title,
  hint,
  value,
  min,
  max,
  format,
  onMinus,
  onPlus,
}: {
  title: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  format: (n: number) => string;
  onMinus: () => void;
  onPlus: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <div className="min-w-0">
        <p className="text-lg font-semibold text-foreground">{title}</p>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMinus}
          disabled={value <= min}
          aria-label={`Decrease ${title.toLowerCase()}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="font-numeric w-9 text-center text-xl font-bold tabular-nums text-foreground">
          {format(value)}
        </span>
        <button
          type="button"
          onClick={onPlus}
          disabled={value >= max}
          aria-label={`Increase ${title.toLowerCase()}`}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
