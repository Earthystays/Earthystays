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
}: {
  slug: string;
  initialActive: boolean;
  loggedIn: boolean;
  variant?: "overlay" | "inline";
}) {
  const router = useRouter();
  const path = usePathname();
  const [active, setActive] = useState(initialActive);
  const [pending, start] = useTransition();

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!loggedIn) {
      toast("Sign in to save villas", {
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
        const res = await fetch(`/api/wishlist/${slug}`, {
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
      className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-foreground shadow-sm transition-all hover:bg-white hover:scale-110 disabled:opacity-60"
    >
      <Heart
        className={`h-4 w-4 ${active ? "fill-rose-500 text-rose-500" : "text-foreground"}`}
        strokeWidth={active ? 0 : 1.8}
      />
    </button>
  );
}
