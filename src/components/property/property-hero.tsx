import Link from "next/link";
import { MapPin, Star } from "lucide-react";
import type { PropertyType, Villa } from "@/lib/types";

const TYPE_LABEL: Record<PropertyType, string> = {
  villa: "Private villa",
  apartment: "Apartment",
  hotel: "Hotel",
  hostel: "Hostel",
};

/**
 * Editorial hero for the property detail page — sits above the gallery so the
 * first thing a guest reads is what the place is, where it is, and how it is
 * rated, rather than a wall of photos with no context.
 *
 * Every field is optional-aware: nothing is rendered unless the property
 * actually carries the data.
 */
export function PropertyHero({
  villa,
  stateName,
  reviewCount,
  rating,
}: {
  villa: Villa;
  stateName?: string;
  /** Combined count (own + imported reviews) — falls back to villa.reviewCount. */
  reviewCount: number;
  rating: number;
}) {
  const type = villa.type ?? "villa";
  const place = [villa.city, stateName].filter(Boolean).join(", ");
  const hasRating = reviewCount > 0 && rating > 0;

  return (
    <header className="grid gap-4">
      {/* Eyebrow — property type + destination, the editorial framing line */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        <span>{TYPE_LABEL[type]}</span>
        {place && (
          <>
            <span aria-hidden="true" className="text-border">
              ·
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-terracotta" aria-hidden="true" />
              {place}
            </span>
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h1 className="font-title text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem]">
            {villa.name}
          </h1>
          {villa.tagline && (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              {villa.tagline}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-4">
          {hasRating && (
            <a
              href="#reviews"
              className="group inline-flex items-center gap-2 rounded-full border border-border/70 bg-card px-4 py-2 transition-colors hover:border-terracotta/40"
            >
              <Star
                className="h-4 w-4 fill-terracotta text-terracotta"
                aria-hidden="true"
              />
              <span className="font-numeric text-sm font-semibold tabular-nums text-foreground">
                {rating.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground group-hover:text-foreground">
                ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
              </span>
            </a>
          )}

          {/* Primary CTA — anchors to the inquiry card on desktop; on mobile the
              sticky bottom bar carries the same action. */}
          <Link
            href="#inquire"
            className="hidden rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 lg:inline-flex"
          >
            Check availability
          </Link>
        </div>
      </div>
    </header>
  );
}
