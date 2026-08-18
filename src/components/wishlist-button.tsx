"use client";

import { Heart } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

export function WishlistButton({
  slug,
  initialActive,
  loggedIn,
  variant = "overlay",
  size = "md",
  type = "villa",
}: {
  slug: string;
  initialActive: boolean;
  loggedIn: boolean;
  variant?: "overlay" | "inline";
  /** "lg" = 48px circle with 22px icon (listing-card spec). */
  size?: "md" | "lg";
  /** What kind of listing this saves — routes to the right lookup on the API. */
  type?: "villa" | "experience";
}) {
  const router = useRouter();
  const path = usePathname();
  const [active, setActive] = useState(initialActive);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      toast(`Sign in to save ${type === "experience" ? "experiences" : "villas"}`, {
        action: {
          label: "Sign in",
          onClick: () => router.push(`/login?next=${encodeURIComponent(path)}`),
        },
      });
      return;
    }

    const wasActive = active;
    setActive(!wasActive); // optimistic
    start(async () => {
      try {
        const qs = type === "experience" ? "?type=experience" : "";
        const res = await fetch(`/api/wishlist/${slug}${qs}`, {
          method: wasActive ? "DELETE" : "POST",
        });
        const j = await res.json();
        if (!res.ok || !j.ok) throw new Error(j.error ?? "Failed");
        if (wasActive) toast.success("Removed from wishlist");
        else toast.success("Saved to wishlist");
      } catch (err) {
        setActive(wasActive); // rollback
        toast.error(err instanceof Error ? err.message : "Could not save");
      }
    });
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
        aria-pressed={active}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm hover:bg-muted disabled:opacity-60"
      >
        <Heart
          className={`h-4 w-4 ${active ? "fill-rose-500 text-rose-500" : "text-foreground"}`}
          strokeWidth={active ? 0 : 1.8}
        />
        {active ? "Saved" : "Save"}
      </button>
    );
  }

  // Overlay (sits over a photo, top-right of cards/galleries)
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-label={active ? "Remove from wishlist" : "Save to wishlist"}
      aria-pressed={active}
      className={`group/heart inline-flex items-center justify-center rounded-full bg-white/90 text-foreground transition-colors duration-[180ms] hover:bg-[#F8F8F8] disabled:opacity-60 ${
        size === "lg"
          ? "h-12 w-12 shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
          : "h-9 w-9 shadow-sm"
      }`}
    >
      <Heart
        className={`transition-[transform,color,fill] duration-[180ms] ease-out motion-reduce:transition-none ${size === "lg" ? "h-[22px] w-[22px]" : "h-4 w-4"} ${
          active
            ? "scale-[1.08] fill-[#2F4A3A] text-[#2F4A3A]"
            : "text-[#666666] group-hover/heart:text-[#2F4A3A]"
        }`}
        strokeWidth={active ? 0 : 1.8}
      />
    </button>
  );
}
