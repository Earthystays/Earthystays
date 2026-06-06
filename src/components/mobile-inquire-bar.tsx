"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InquiryForm } from "@/components/inquiry-form";

/**
 * Mobile-only sticky bottom bar on villa detail pages: shows the price +
 * "Enquire" button. Tapping the button opens the full InquiryForm (same
 * one that lives in the desktop sidebar — name, phone, check-in/out, guests)
 * inside a bottom-anchored sheet, so mobile and desktop use identical fields.
 *
 * Hides on desktop (lg:hidden).
 */
export function MobileInquireBar({
  villaSlug,
  villaName,
  pricePerNight,
}: {
  villaSlug: string;
  villaName: string;
  pricePerNight: number;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post-hydration mount flag
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
          className="inline-flex h-12 max-w-[200px] flex-1 items-center justify-center rounded-md bg-primary text-sm font-semibold uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Enquire
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* Bottom-anchored sheet on mobile, full height up to 95vh.
            Holds the same InquiryForm desktop users see in the sidebar. */}
        <SheetContent
          side="bottom"
          className="h-[95vh] overflow-y-auto rounded-t-2xl p-0"
        >
          <SheetHeader className="border-b border-border/60 px-5 py-4">
            <SheetTitle className="font-display text-xl font-bold tracking-tight">
              Send Inquiry
            </SheetTitle>
          </SheetHeader>
          <div className="px-5 py-5">
            <InquiryForm villaSlug={villaSlug} villaName={villaName} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer so the sticky bar doesn't cover the last bit of content */}
      <div aria-hidden className="h-20 lg:hidden" />
    </>
  );
}
