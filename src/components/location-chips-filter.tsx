"use client";

import { useMemo, useState } from "react";
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
  allProperties,
  loggedIn,
  wishlist,
}: {
  /** Default-tab properties — typically the featured ones. */
  properties: Villa[];
  /** Full list of properties for this section's type. Drives the chip
   *  list (so every city with a villa shows up, not just cities that
   *  happen to have a featured one) and supplies results when a city
   *  chip is selected. Falls back to `properties` if omitted. */
  allProperties?: Villa[];
  loggedIn: boolean;
  wishlist: Set<string>;
}) {
  const [activeCity, setActiveCity] = useState<string | null>(null);
  const fullList = allProperties ?? properties;

  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of fullList) {
      const c = (v.city ?? "").trim();
      if (!c) continue;
      counts.set(c, (counts.get(c) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name);
  }, [fullList]);

  const filtered = activeCity
    ? fullList.filter((v) => (v.city ?? "").trim() === activeCity)
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
