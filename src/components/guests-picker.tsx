"use client";

import { useEffect, useRef, useState } from "react";
import { Info, Minus, Plus, Users as UsersIcon } from "lucide-react";
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
  /** Called when the user hits the confirm button. Receives the chosen Guests
   *  directly so callers don't have to wait for state to update. */
  onApplyAndSearch?: (g: Guests) => void;
  className?: string;
  /** Single, compact trigger button (used inside the villa inquiry form). */
  compactTrigger?: boolean;
  /** Label for the confirm button. Defaults to "Apply & Search". */
  applyLabel?: string;
  /** Show the "Children and infants are included…" info line above the footer. */
  showFooterNote?: boolean;
  /** Plain counts (2) vs padded/plus (02, 1+). Defaults to false. */
  plainCounts?: boolean;
};

export function GuestsPicker({
  value,
  onChange,
  onApplyAndSearch,
  className = "",
  compactTrigger = false,
  applyLabel = "Apply & Search",
  showFooterNote = false,
  plainCounts = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const [draft, setDraft] = useState<Guests>(value);
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  function toggle() {
    setOpen((o) => {
      if (!o) {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) {
          const below = window.innerHeight - rect.bottom;
          setDropUp(rect.top > below);
        }
      }
      return !o;
    });
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: prime local draft from parent value on open
    if (open) setDraft(value);
  }, [open, value]);

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

  const totalPeople = value.adults + value.children;
  const summary = plainCounts
    ? `${totalPeople} Guest${totalPeople === 1 ? "" : "s"} · ${value.rooms} Room${value.rooms === 1 ? "" : "s"}`
    : `${totalPeople} Guest${totalPeople === 1 ? "" : "s"}, ${value.rooms}+ Room${value.rooms === 1 ? "" : "s"}`;

  const numFmt = plainCounts ? (n: number) => String(n) : (n: number) => String(n).padStart(2, "0");
  const roomsFmt = plainCounts ? (n: number) => String(n) : (n: number) => `${n}+`;

  return (
    <div ref={ref} className={`relative ${className}`}>
      {compactTrigger ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-md border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40"
        >
          <UsersIcon className="h-4 w-4 shrink-0 text-forest-green" />
          <span className="min-w-0 flex-1 text-[14px] text-foreground">{summary}</span>
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
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
      )}

      {open && (
        <div
          className={`absolute right-0 z-50 flex max-h-[80vh] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-y-auto rounded-2xl border border-border/60 bg-card shadow-2xl ${
            dropUp ? "bottom-full mb-3" : "top-full mt-3"
          }`}
        >
          <div className="grid divide-y divide-border/60">
            <StepperRow
              title="Adults"
              hint="Age 13 years and above"
              value={draft.adults}
              min={1}
              max={30}
              format={numFmt}
              onMinus={() => set("adults", (n) => Math.max(1, n - 1))}
              onPlus={() => set("adults", (n) => Math.min(30, n + 1))}
            />
            <StepperRow
              title="Children"
              hint="Age 3–12 years"
              value={draft.children}
              min={0}
              max={20}
              format={numFmt}
              onMinus={() => set("children", (n) => Math.max(0, n - 1))}
              onPlus={() => set("children", (n) => Math.min(20, n + 1))}
            />
            <StepperRow
              title="Infants"
              hint="Age 0–2 years"
              value={draft.infants}
              min={0}
              max={10}
              format={numFmt}
              onMinus={() => set("infants", (n) => Math.max(0, n - 1))}
              onPlus={() => set("infants", (n) => Math.min(10, n + 1))}
            />
            <StepperRow
              title="Rooms"
              value={draft.rooms}
              min={1}
              max={20}
              format={roomsFmt}
              onMinus={() => set("rooms", (n) => Math.max(1, n - 1))}
              onPlus={() => set("rooms", (n) => Math.min(20, n + 1))}
            />
          </div>
          {showFooterNote && (
            <div className="flex items-start gap-2 border-t border-border/60 bg-sand/40 px-4 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>Children and infants are included in the total guests count.</span>
            </div>
          )}
          <div className="flex items-center gap-3 border-t border-border/60 bg-muted/30 p-4">
            <Button
              type="button"
              variant="outline"
              onClick={clear}
              className="h-11 flex-1 justify-center rounded-md text-sm font-semibold tracking-wide"
            >
              Clear
            </Button>
            <Button
              type="button"
              onClick={applyAndSearch}
              className="h-11 flex-1 justify-center rounded-md text-sm font-semibold tracking-wide"
            >
              {applyLabel}
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
    <div className="flex items-center justify-between px-5 py-3.5">
      <div className="min-w-0">
        <p className="text-[15px] font-semibold text-foreground">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMinus}
          disabled={value <= min}
          aria-label={`Decrease ${title.toLowerCase()}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="font-numeric w-7 text-center text-base font-semibold tabular-nums text-foreground">
          {format(value)}
        </span>
        <button
          type="button"
          onClick={onPlus}
          disabled={value >= max}
          aria-label={`Increase ${title.toLowerCase()}`}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
