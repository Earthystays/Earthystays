import Link from "next/link";
import { Star, Users, BedDouble, MapPin, ArrowUpRight } from "lucide-react";
import type { Villa } from "@/lib/types";
import { formatNight } from "@/lib/format";
import { PhotoCarousel } from "@/components/photo-carousel";
import { WishlistButton } from "@/components/wishlist-button";

export function VillaCard({
  villa,
  loggedIn = false,
  inWishlist = false,
}: {
  villa: Villa;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  // Build the display location from villa fields directly — keeps this
  // component client-safe (no fs-dependent imports through location lookups).
  const location =
    villa.city && villa.state
      ? `${villa.city}, ${villa.state}`
      : villa.state || "";

  return (
    <Link
      href={`/villas/${villa.slug}`}
      className="group block overflow-hidden rounded-xl bg-card border border-border/60 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Mobile: square image — bigger visual presence in the horizontal
          slider so the card fills the space without leaving a gap below.
          Desktop keeps the wider 4:3 since the grid context doesn't need
          the extra height. */}
      <div className="relative aspect-square overflow-hidden bg-muted sm:aspect-[4/3]">
        <PhotoCarousel images={villa.images} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton slug={villa.slug} loggedIn={loggedIn} initialActive={inWishlist} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/40 to-transparent p-4 flex items-end justify-between">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground">
            <Star className="h-3 w-3 fill-terracotta text-terracotta" />
            {villa.rating.toFixed(2)}
            <span className="text-muted-foreground">· {villa.reviewCount}</span>
          </span>
          {/* Visual CTA — actual click is handled by the parent Link wrapping the whole card */}
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/95 px-3 py-1.5 text-xs font-semibold text-background opacity-90 transition-opacity group-hover:opacity-100">
            View Property
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </div>
        <h3 className="mt-1 font-display text-xl text-foreground">{villa.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{villa.tagline}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {villa.bedrooms} BR
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Sleeps {villa.maxGuests}
          </span>
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-sm text-foreground">
            <span className="font-medium">{formatNight(villa.pricePerNight)}</span>
          </p>
          <span className="text-xs uppercase tracking-wider text-terracotta group-hover:translate-x-0.5 transition-transform">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
