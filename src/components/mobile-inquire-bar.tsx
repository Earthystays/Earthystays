"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import dynamic from "next/dynamic";

/**
 * The form only ever renders after the user taps "Enquire", so its JS
 * (react-hook-form + zod + the field components) has no business being in
 * the initial bundle. Loading it lazily also stops Turbopack hoisting
 * react-hook-form into a shared chunk that every route pays for — the
 * listing pages were downloading ~84KB of form code they never use.
 */
const InquiryForm = dynamic(
  () => import("@/components/inquiry-form").then((m) => m.InquiryForm),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-1" aria-busy="true" aria-label="Loading form">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-md bg-muted" />
      </div>
    ),
  },
);
import { ConnectWithHost } from "@/components/connect-with-host";
import { useUnitSelection } from "@/lib/unit-selection";

/**
 * Mobile-only sticky bottom bar on villa detail pages: shows the price +
 * "Enquire" button. Tapping the button opens the InquiryForm inside a
 * partial-height (88vh) bottom-anchored sheet with a drag-handle at the
 * top — swipe it down with your thumb to dismiss (and reopen anytime;
 * form state is preserved via keepMounted).
 *
 * Hides on desktop (lg:hidden).
 */
export function MobileInquireBar({
  villaSlug,
  villaName,
  pricePerNight,
  unitLabel,
}: {
  villaSlug: string;
  villaName: string;
  pricePerNight: number;
  unitLabel?: "Room" | "Bed";
}) {
  const [open, setOpen] = useState(false);
  const selection = useUnitSelection(villaSlug);
  // Once the guest picks a room/bed, the bar reflects that price instead of the
  // "starting from" figure.
  const barPrice = selection?.item.unitPrice ?? pricePerNight;
  const barSubLabel = selection
    ? `${selection.item.quantity} ${unitLabel ?? "Room"}${selection.item.quantity === 1 ? "" : "s"} · ${selection.item.unitName}`
    : "per night + taxes";
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration mount flag
    setMounted(true);
  }, []);

  // Drag-to-dismiss: track pointer Y on the handle, translate the sheet
  // downward as the finger moves. Release past 120px → close; otherwise
  // spring back.
  const popupRef = useRef<HTMLDivElement | null>(null);
  const dragStartY = useRef<number | null>(null);
  const dragDelta = useRef(0);

  function setTranslate(y: number) {
    const el = popupRef.current;
    if (!el) return;
    el.style.transform = y > 0 ? `translateY(${y}px)` : "";
    el.style.transition = "none";
  }
  function resetTranslate(animated: boolean) {
    const el = popupRef.current;
    if (!el) return;
    el.style.transition = animated ? "transform 180ms ease-out" : "none";
    el.style.transform = "";
  }

  function onDragStart(e: React.PointerEvent) {
    dragStartY.current = e.clientY;
    dragDelta.current = 0;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (dragStartY.current === null) return;
    const dy = e.clientY - dragStartY.current;
    dragDelta.current = dy;
    if (dy > 0) setTranslate(dy);
  }
  function onDragEnd() {
    if (dragStartY.current === null) return;
    const shouldClose = dragDelta.current > 120;
    dragStartY.current = null;
    if (shouldClose) {
      resetTranslate(true);
      setOpen(false);
    } else {
      resetTranslate(true);
    }
  }

  if (!mounted) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="leading-tight">
          <p className="font-numeric text-lg font-bold tabular-nums text-foreground">
            ₹{barPrice.toLocaleString("en-IN")}
            {selection && <span className="text-xs font-normal text-muted-foreground"> / night</span>}
          </p>
          <p className="max-w-[46vw] truncate text-[10px] text-muted-foreground">{barSubLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 max-w-[200px] flex-1 items-center justify-center rounded-md bg-primary text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Enquire
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          keepMounted
          ref={popupRef}
          className="h-[85dvh] max-h-[85dvh] overflow-hidden rounded-t-2xl p-0 shadow-2xl"
        >
          {/* Drag handle strip: entire top area is a pointer target so
              the user can grab from the pill OR the header. */}
          <div
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={onDragEnd}
            onPointerCancel={onDragEnd}
            className="touch-none select-none"
            style={{ touchAction: "none" }}
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <span
                aria-hidden
                className="h-1.5 w-11 rounded-full bg-muted-foreground/40"
              />
            </div>
            <SheetHeader className="gap-0 border-b border-border/60 bg-background px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => setOpen(false)}
                  aria-label="Back to property"
                  className="-ml-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <SheetTitle className="min-w-0 flex-1 truncate font-display text-lg font-bold tracking-tight">
                  Send inquiry
                </SheetTitle>
                <span className="text-[11px] text-muted-foreground">
                  Swipe ↓ to minimize
                </span>
              </div>
            </SheetHeader>
          </div>

          <div className="h-[calc(85dvh-10.5rem)] overflow-y-auto px-5 py-5 pb-6 overscroll-contain">
            <InquiryForm villaSlug={villaSlug} villaName={villaName} unitLabel={unitLabel} />
          </div>
          <div className="sticky bottom-0 border-t border-border/60 bg-background px-5 py-3">
            <ConnectWithHost />
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer so the sticky bar doesn't cover the last bit of content */}
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}
