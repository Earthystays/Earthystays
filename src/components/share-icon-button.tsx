"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Compact share icon button for use inside listing cards (those cards are
 * wrapped in a Link, so we stop propagation here to avoid navigation).
 * Tries the native share sheet first, falls back to copying the URL.
 */
export function ShareIconButton({
  slug,
  villaName,
}: {
  slug: string;
  villaName: string;
}) {
  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/villas/${slug}`
        : `/villas/${slug}`;
    const title = `${villaName} — Earthy Stays`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or browser failed → fall back to copy
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Share this villa"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm transition-colors hover:bg-white"
    >
      <Share2 className="h-4 w-4" />
    </button>
  );
}
