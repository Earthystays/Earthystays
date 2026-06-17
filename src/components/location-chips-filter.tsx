"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VillaCard } from "@/components/villa-card";
import { ScrollSlider } from "@/components/scroll-slider";
import type { Villa } from "@/lib/types";

/**
 * Client-side location filter for the Featured Villas / Apartments rows
 * on the home page. Renders a horizontal scroll of city chips (computed
 * from the property list) above a swipeable card slider. Tapping a chip
 * narrows the slider to only show properties in that city.
 *
 * The chip row is mobile-first horizontal scroll; on desktop it wraps.
 */
export function LocationChipsFilter({
  properties,
  loggedIn,
  wishlist,
  exploreHref,
  exploreLabel = "Explore more",
}: {
  properties: Villa[];
  loggedIn: boolean;
  wishlist: Set<string>;
  exploreHref?: string;
  exploreLabel?: string;
}) {
  const [activeCity, setActiveCity] = useState<string | null>(null);

  // Unique city names present in the property list, preserving insertion order.
  const cities = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const v of properties) {
      const c = (v.city ?? "").trim();
      if (!c || seen.has(c)) continue;
      seen.add(c);
      ordered.push(c);
    }
    return ordered;
  }, [properties]);

  const filtered = activeCity
    ? properties.filter((v) => (v.city ?? "").trim() === activeCity)
    : properties.slice(0, 8);

  return (
    <div className="mt-8">
      {/* City chips — horizontal scroll on mobile, wraps on desktop */}
      {cities.length > 1 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:flex-wrap sm:px-0">
          <ChipButton
            label="All"
            active={activeCity === null}
            onClick={() => setActiveCity(null)}
          />
          {cities.map((c) => (
            <ChipButton
              key={c}
              label={c}
              active={activeCity === c}
              onClick={() => setActiveCity(c)}
            />
          ))}
        </div>
      )}

      {/* Card slider — single big card on mobile (swipe), grid on desktop */}
      <ScrollSlider className="mt-6 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-6 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {filtered.map((v) => (
          <div
            key={v.slug}
            className="w-[80vw] shrink-0 snap-start sm:w-auto sm:shrink"
          >
            <VillaCard
              villa={v}
              loggedIn={loggedIn}
              inWishlist={wishlist.has(v.slug)}
            />
          </div>
        ))}
        {exploreHref && filtered.length > 0 && (
          <div className="w-[80vw] shrink-0 snap-start sm:w-auto sm:shrink">
            <Link
              href={exploreHref}
              className="group flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card/40 px-6 py-10 text-center transition-colors hover:border-foreground/40 hover:bg-card sm:min-h-[320px]"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-background transition-transform group-hover:scale-110">
                <ArrowRight className="h-5 w-5" />
              </span>
              <span className="font-display text-xl font-semibold text-foreground">
                {exploreLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                See every property in this category
              </span>
            </Link>
          </div>
        )}
      </ScrollSlider>

      {filtered.length === 0 && activeCity && (
        <p className="mt-6 text-center text-sm text-muted-foreground">
          No stays in {activeCity} yet.
        </p>
      )}
    </div>
  );
}

function ChipButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-background text-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}
