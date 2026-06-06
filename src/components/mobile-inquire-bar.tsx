"use client";

import { useEffect, useState } from "react";
import { CallbackModal } from "@/components/callback-modal";

/**
 * Mobile-only sticky bottom bar on villa detail pages: shows the price
 * + "Enquire" button so guests don't have to scroll all the way down to
 * the inquiry form. The button opens the same callback modal used on the
 * home page Request Callback CTA.
 *
 * Hides on desktop (lg:hidden).
 */
export function MobileInquireBar({
  pricePerNight,
}: {
  pricePerNight: number;
}) {
  const [open, setOpen] = useState(false);
  // Hide on initial render until we're hydrated (avoids flash above SSR fold).
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration mount flag, intentional
    setMounted(true);
  }, []);
  if (!mounted) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur lg:hidden">
        <div className="leading-tight">
          <p className="font-numeric text-lg font-bold tabular-nums text-foreground">
            ₹{pricePerNight.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] text-muted-foreground">per night + taxes</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-12 flex-1 max-w-[200px] items-center justify-center rounded-md bg-primary text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Enquire
        </button>
      </div>

      <CallbackModal open={open} onOpenChange={setOpen} />

      {/* Leave space at the bottom of the page so the sticky bar doesn't
          cover the last bit of content. */}
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}
