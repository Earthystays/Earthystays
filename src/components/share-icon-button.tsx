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
  path,
  ariaLabel = "Share this villa",
  size = "md",
}: {
  slug: string;
  villaName: string;
  /** Relative URL to share — defaults to `/villas/{slug}` for existing callers. */
  path?: string;
  ariaLabel?: string;
  /** "lg" = 48px circle with 22px icon (listing-card spec). */
  size?: "md" | "lg";
}) {
  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const relPath = path ?? `/villas/${slug}`;
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}${relPath}`
        : relPath;
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
      aria-label={ariaLabel}
      className={`group/share inline-flex items-center justify-center rounded-full bg-white/95 text-foreground transition-colors duration-[180ms] hover:bg-[#F7F7F7] ${
        size === "lg"
          ? "h-12 w-12 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          : "h-9 w-9 shadow-sm"
      }`}
    >
      <Share2
        className={`transition-transform duration-[180ms] group-hover/share:rotate-[5deg] motion-reduce:transition-none ${size === "lg" ? "h-[22px] w-[22px]" : "h-4 w-4"}`}
      />
    </button>
  );
}
