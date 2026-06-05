import { ExternalLink, Star } from "lucide-react";
import type { Villa } from "@/lib/types";

const PLATFORM_DOMAINS: Record<string, string> = {
  Airbnb: "airbnb.com",
  "Booking.com": "booking.com",
  Google: "google.com",
  Vrbo: "vrbo.com",
  TripAdvisor: "tripadvisor.com",
  Agoda: "agoda.com",
  Expedia: "expedia.com",
};

function platformColor(platform: string): string {
  switch (platform.toLowerCase()) {
    case "airbnb":
      return "text-[#FF385C]";
    case "booking.com":
    case "booking":
      return "text-[#003B95]";
    case "google":
      return "text-[#4285F4]";
    case "vrbo":
      return "text-[#1668e3]";
    case "tripadvisor":
      return "text-[#00AF87]";
    case "agoda":
      return "text-[#5392F9]";
    default:
      return "text-foreground";
  }
}

export function ExternalReviews({ villa }: { villa: Villa }) {
  const listings = villa.externalListings ?? [];
  if (listings.length === 0) return null;

  // Aggregate rating across platforms with reviewCount
  const withRating = listings.filter((l) => typeof l.rating === "number");
  let weightedAvg: number | null = null;
  let totalReviews = 0;
  if (withRating.length > 0) {
    let sum = 0;
    let weight = 0;
    for (const l of withRating) {
      const c = l.reviewCount ?? 1;
      sum += (l.rating as number) * c;
      weight += c;
      totalReviews += l.reviewCount ?? 0;
    }
    weightedAvg = weight > 0 ? sum / weight : null;
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-xl font-bold tracking-tight text-foreground">Also reviewed on</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            This villa is also listed on the platforms below — read more reviews there.
          </p>
        </div>
        {weightedAvg && (
          <div className="text-right">
            <p className="inline-flex items-center gap-1.5 font-numeric text-2xl font-semibold tabular-nums text-foreground">
              <Star className="h-5 w-5 fill-terracotta text-terracotta" />
              {weightedAvg.toFixed(1)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              avg across {totalReviews.toLocaleString("en-IN")} reviews
            </p>
          </div>
        )}
      </div>

      <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((listing, i) => (
          <li key={i}>
            <a
              href={listing.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-full flex-col gap-2 rounded-xl border border-border/60 bg-background p-4 transition-all hover:border-foreground/40 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${platformColor(listing.platform)}`}>
                  {listing.platform}
                </span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              {typeof listing.rating === "number" ? (
                <div className="flex items-center gap-1 text-xs text-foreground">
                  <Star className="h-3.5 w-3.5 fill-terracotta text-terracotta" />
                  <span className="font-numeric font-semibold tabular-nums">
                    {listing.rating.toFixed(1)}
                  </span>
                  {listing.reviewCount !== undefined && (
                    <span className="text-muted-foreground">
                      · {listing.reviewCount.toLocaleString("en-IN")} reviews
                    </span>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">View listing →</p>
              )}
              <p className="mt-auto truncate text-[11px] text-muted-foreground">
                {PLATFORM_DOMAINS[listing.platform] ??
                  new URL(listing.url).hostname.replace(/^www\./, "")}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
