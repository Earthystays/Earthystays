import Link from "next/link";
import { Star, MapPin, ArrowUpRight, DoorOpen, BedDouble } from "lucide-react";
import type { Villa } from "@/lib/types";
import { formatNight } from "@/lib/format";
import { propertyPath } from "@/lib/property-url";
import {
  getUnits,
  startingFromPrice,
  totalAvailableCount,
} from "@/lib/data/units";
import { PhotoCarousel } from "@/components/photo-carousel";
import { WishlistButton } from "@/components/wishlist-button";

/**
 * Browse card for hotels & hostels (Phase — browse pages). Mirrors VillaCard's
 * visual language but surfaces accommodation-unit facts: room/dorm-type count,
 * starting-from price, and pooled availability — instead of villa bedroom/bath
 * counts, which don't apply.
 */
export function PropertyBrowseCard({
  villa,
  loggedIn = false,
  inWishlist = false,
}: {
  villa: Villa;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  const isHostel = villa.type === "hostel";
  const location =
    villa.city && villa.state ? `${villa.city}, ${villa.state}` : villa.state || "";
  const units = getUnits(villa);
  const typeCount = units.length;
  const startFrom = startingFromPrice(villa);
  const available = totalAvailableCount(villa);

  const typeNoun = isHostel ? "dorm type" : "room type";
  const availNoun = isHostel ? "Bed" : "Room";
  const Icon = isHostel ? BedDouble : DoorOpen;

  return (
    <Link
      href={propertyPath(villa)}
      className="group block overflow-hidden rounded-xl bg-card border border-border/60 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-square overflow-hidden bg-muted sm:aspect-[4/3]">
        <PhotoCarousel
          images={villa.images}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
        <div className="absolute right-3 top-3 z-10">
          <WishlistButton slug={villa.slug} loggedIn={loggedIn} initialActive={inWishlist} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] bg-gradient-to-t from-black/40 to-transparent p-4 flex items-end justify-between">
          {villa.reviewCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground">
              <Star className="h-3 w-3 fill-terracotta text-terracotta" />
              {villa.rating.toFixed(2)}
              <span className="text-muted-foreground">· {villa.reviewCount}</span>
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/95 px-3 py-1.5 text-xs font-semibold text-background opacity-90 transition-opacity group-hover:opacity-100">
            View {isHostel ? "Hostel" : "Hotel"}
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPin className="h-3 w-3" />
          {location}
        </div>
        <h3 className="mt-1 font-title font-semibold text-xl text-foreground">{villa.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{villa.tagline}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
          {typeCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Icon className="h-3.5 w-3.5" />
              {typeCount} {typeNoun}
              {typeCount === 1 ? "" : "s"}
            </span>
          )}
          {available > 0 && (
            <span className="inline-flex items-center gap-1 text-primary">
              {available} {availNoun}
              {available === 1 ? "" : "s"} available
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Starting from
            </p>
            <p className="text-sm text-foreground">
              <span className="font-medium">{formatNight(startFrom)}</span>
              {isHostel && <span className="text-muted-foreground"> / bed</span>}
            </p>
          </div>
          <span className="text-xs uppercase tracking-wider text-terracotta group-hover:translate-x-0.5 transition-transform">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
