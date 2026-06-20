import Image from "next/image";
import { Star, User, MapPin } from "lucide-react";
import {
  formatStayMonth,
  getAverageRating,
  type StoredReview,
} from "@/lib/data/reviews";

/**
 * Per-villa reviews block — rendered above the existing rating-summary
 * card on the villa detail page when the team has linked any review to
 * the villa via villaSlug in /admin/reviews. Hides itself when there are
 * none so unpopulated villas don't get an empty section.
 */
export function VillaReviews({ reviews }: { reviews: StoredReview[] }) {
  if (reviews.length === 0) return null;
  const avg = getAverageRating(reviews);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-end gap-x-4 gap-y-1">
        <div className="flex items-baseline gap-2">
          <p className="font-numeric text-4xl font-semibold tabular-nums text-foreground">
            {avg.toFixed(1)}
          </p>
          <div className="flex gap-0.5 text-terracotta">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < Math.round(avg) ? "fill-terracotta" : "fill-none opacity-40"
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on {reviews.length}{" "}
          {reviews.length === 1 ? "guest review" : "guest reviews"}
        </p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2">
        {reviews.map((r) => (
          <li
            key={r.id}
            className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-5"
          >
            <header className="flex items-center gap-3">
              {r.guestPhoto && r.showPhoto !== false ? (
                <Image
                  src={r.guestPhoto}
                  alt={r.guestName}
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-terracotta/10 text-terracotta">
                  <User className="h-5 w-5" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.guestName}
                </p>
                {r.guestLocation && (
                  <p className="truncate text-xs text-muted-foreground">
                    {r.guestLocation}
                  </p>
                )}
              </div>
              <div
                className="flex shrink-0 gap-0.5 text-terracotta"
                aria-label={`${r.rating} out of 5`}
              >
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    className={`h-3.5 w-3.5 ${
                      j < r.rating ? "fill-terracotta" : "fill-none opacity-30"
                    }`}
                  />
                ))}
              </div>
            </header>

            {r.title && (
              <p className="font-display text-base font-semibold text-foreground">
                {r.title}
              </p>
            )}
            <p className="text-sm leading-relaxed text-foreground/85">
              {r.quote}
            </p>

            {(r.stayMonth || r.location) && (
              <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                {r.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {r.location}
                  </span>
                )}
                {r.stayMonth && <span>Stayed {formatStayMonth(r.stayMonth)}</span>}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
