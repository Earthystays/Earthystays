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
  /** Single, compact trigger button (used inside the villa inquiry form). */
  compactTrigger?: boolean;
  /** Label for the confirm button in the footer. Defaults to "Apply". */
  applyLabel?: string;
};

export function DateRangePicker({
  value,
  onChange,
  className = "",
  compactTrigger = false,
  applyLabel = "Apply",
}: Props) {
  const [open, setOpen] = useState(false);
  const [desktopRight, setDesktopRight] = useState<number | undefined>(undefined);
  const [draft, setDraft] = useState<DateRange | undefined>(value);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverPanelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  function toggle() {
    setOpen((o) => {
      if (!o && !isMobile) {
        // For the compact trigger (half-width in the inquiry form row), align
        // the popover to the CONTAINING ROW's right edge so it doesn't hang
        // off the middle of the sidebar. For the full-width trigger, keep the
        // original behavior (align to the trigger's own right edge).
        const anchor = compactTrigger
          ? popoverRef.current?.parentElement ?? triggerRef.current
          : triggerRef.current;
        const rect = anchor?.getBoundingClientRect();
        if (rect) setDesktopRight(document.documentElement.clientWidth - rect.right);
      } else {
        setDesktopRight(undefined);
      }
      return !o;
    });
  }

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: prime local draft from parent value on open
    if (open) setDraft(value);
  }, [open, value]);

  useEffect(() => {
    if (!open || !isMobile) return;
    const id = window.setTimeout(() => {
      popoverPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 50);
    return () => window.clearTimeout(id);
  }, [open, isMobile]);

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

  const nights = value?.from && value?.to ? nightsBetween(value.from, value.to) : 0;

  return (
    <div ref={popoverRef} className={`relative ${className}`}>
      <div ref={triggerRef}>
        {compactTrigger ? (
          <button
            type="button"
            onClick={toggle}
            className="flex w-full items-center gap-3 rounded-md border border-border/70 bg-background px-4 py-3 text-left transition-colors hover:bg-muted/40"
          >
            <Calendar className="h-4 w-4 shrink-0 text-forest-green" />
            <span className="min-w-0 flex-1">
              {value?.from && value?.to ? (
                <>
                  <span className="block text-[14px] font-medium text-foreground">
                    {format(value.from, "d MMM")} – {format(value.to, "d MMM")}
                  </span>
                  <span className="block text-[11px] text-muted-foreground">
                    {nights} night{nights === 1 ? "" : "s"}
                  </span>
                </>
              ) : (
                <span className="block text-[14px] text-muted-foreground">
                  Check-in – Check-out
                </span>
              )}
            </span>
          </button>
        ) : (
          <div className="grid grid-cols-2 divide-x divide-border/60">
            <FieldButton
              label="Check-in"
              placeholder="Select Date"
              value={value?.from ? format(value.from, "d MMM") : ""}
              onClick={toggle}
            />
            <FieldButton
              label="Check-out"
              placeholder="Select Date"
              value={value?.to ? format(value.to, "d MMM") : ""}
              onClick={toggle}
            />
          </div>
        )}
      </div>

      {open && (
        <div
          ref={popoverPanelRef}
          style={
            !isMobile && desktopRight !== undefined
              ? {
                  position: "fixed",
                  right: desktopRight,
                  top: "50%",
                  transform: "translateY(-50%)",
                  maxHeight: "calc(100vh - 6rem)",
                }
              : undefined
          }
          className={`
            rdp-popover z-50 flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl
            ${
              !isMobile && desktopRight !== undefined
                ? "w-max max-w-[calc(100vw-2rem)]"
                : "absolute left-0 right-0 top-full mt-3 w-auto"
            }
          `}
        >
          {/* Compact summary header — CHECK-IN / CHECK-OUT */}
          <div className="grid shrink-0 grid-cols-2 gap-3 border-b border-border/60 bg-muted/20 px-4 py-3 sm:px-5">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Check-in
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {draft?.from ? format(draft.from, "d MMM yyyy") : "Select date"}
              </p>
            </div>
            <div className="border-l border-border/60 pl-3">
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Check-out
              </p>
              <p className="mt-0.5 text-sm font-medium text-foreground">
                {draft?.to ? format(draft.to, "d MMM yyyy") : "Select date"}
              </p>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-5">
            <DayPicker
              mode="range"
              numberOfMonths={isMobile ? 1 : 2}
              weekStartsOn={1}
              selected={draft}
              onSelect={setDraft}
              disabled={{ before: today }}
              modifiers={{ weekend: { dayOfWeek: [0, 6] } }}
              modifiersClassNames={{ weekend: "rdp-weekend" }}
              classNames={{
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

          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border/60 bg-muted/30 px-4 py-3">
            <button
              type="button"
              onClick={clear}
              className="text-sm text-muted-foreground hover:text-foreground disabled:opacity-40"
              disabled={!draft?.from}
            >
              Clear
            </button>
            <Button
              onClick={apply}
              className="rounded-md px-8 text-sm font-semibold tracking-wide"
            >
              {applyLabel}
            </Button>
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
