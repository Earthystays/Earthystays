"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, MapPin, Star, Users, BedDouble, Bath } from "lucide-react";

const KEY = "earthystays:recent";

export type RecentCandidate = {
  slug: string;
  type: "villa" | "apartment";
  name: string;
  image: string;
  imageAlt: string;
  rating: number;
  city?: string;
  state?: string;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
};

type Entry = { slug: string; ts: number };

/**
 * Horizontal carousel of "properties recently visited". Reads slugs from
 * localStorage (set by <RecentlyVisitedTracker/> on each villa detail page),
 * matches them against `candidates`, and renders cards in visit order.
 *
 * Hides itself entirely if the visitor has no history yet.
 */
export function RecentlyVisited({ candidates }: { candidates: RecentCandidate[] }) {
  const [items, setItems] = useState<RecentCandidate[]>([]);
  const [mounted, setMounted] = useState(false);
  const scroller = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  // Hydrate from localStorage on mount. Canonical "after hydration" pattern —
  // localStorage is unavailable during SSR, so we have to read it post-mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: hydration flag + reading external (localStorage) state
    setMounted(true);
    try {
      const raw = localStorage.getItem(KEY);
      const list: Entry[] = raw ? JSON.parse(raw) : [];
      const bySlug = new Map(candidates.map((c) => [c.slug, c]));
      const ordered: RecentCandidate[] = [];
      for (const e of list) {
        const c = bySlug.get(e.slug);
        if (c) ordered.push(c);
      }
      setItems(ordered);
    } catch {
      // ignore
    }
  }, [candidates]);

  // Track scroll position so we can fade out arrows at the edges
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setAtStart(el.scrollLeft <= 4);
      setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    return () => el.removeEventListener("scroll", update);
  }, [items]);

  function scroll(dir: 1 | -1) {
    const el = scroller.current;
    if (!el) return;
    const step = Math.round(el.clientWidth * 0.85);
    el.scrollBy({ left: step * dir, behavior: "smooth" });
  }

  // Don't render anything until after hydration (avoids mismatch) and
  // skip the section entirely if the visitor has no history.
  if (!mounted || items.length === 0) return null;

  return (
    <section className="container-page py-16 lg:py-20">
      <h2 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Properties recently visited
      </h2>

      <div className="relative mt-6">
        {/* Prev arrow */}
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scroll(-1)}
          disabled={atStart}
          className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Scroller */}
        <div
          ref={scroller}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:thin]"
        >
          {items.map((it) => (
            <Card key={it.slug} item={it} />
          ))}
        </div>

        {/* Next arrow */}
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scroll(1)}
          disabled={atEnd}
          className="absolute right-0 top-1/2 z-10 translate-x-1/2 -translate-y-1/2 inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-background text-foreground shadow-sm transition-opacity hover:bg-muted disabled:opacity-0 disabled:pointer-events-none"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </section>
  );
}

function Card({ item }: { item: RecentCandidate }) {
  const href = item.type === "apartment" ? `/villas/${item.slug}` : `/villas/${item.slug}`;
  const locParts = [item.city, item.state].filter(Boolean).join(", ");
  return (
    <Link
      href={href}
      className="group block w-[260px] shrink-0 snap-start sm:w-[280px]"
    >
      {/* Image with rating chip */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.imageAlt}
            fill
            sizes="280px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-foreground shadow-sm">
          {item.rating.toFixed(item.rating % 1 === 0 ? 0 : 1)}
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
        </span>
      </div>

      {/* Title + location */}
      <div className="mt-3 px-1">
        <p className="line-clamp-1 text-base font-semibold text-foreground">
          {item.name}
        </p>
        {locParts && (
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            {locParts}
          </p>
        )}
      </div>

      {/* Stats footer */}
      <div className="mt-2 flex items-center gap-3 border-t border-border/60 px-1 pt-2 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Users className="h-3 w-3" /> Up to {item.maxGuests} Guests
        </span>
        <span className="inline-flex items-center gap-1">
          <BedDouble className="h-3 w-3" /> {item.bedrooms} Rooms
        </span>
        <span className="inline-flex items-center gap-1">
          <Bath className="h-3 w-3" /> {item.bathrooms} Baths
        </span>
      </div>
    </Link>
  );
}
