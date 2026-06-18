import Link from "next/link";
import {
  Star,
  MapPin,
  Users,
  BedDouble,
  Bath,
  PawPrint,
  PlayCircle,
} from "lucide-react";
import type { Villa } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { getAmenityIcon } from "@/lib/amenity-icons";
import { buttonVariants } from "@/components/ui/button";
import { PhotoCarousel } from "@/components/photo-carousel";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareIconButton } from "@/components/share-icon-button";

const SHOW_AMENITIES = 4;

/** Heuristic for "Best Rated" badge — featured OR rating ≥ 4.8 with 20+ reviews. */
function isBestRated(villa: Villa): boolean {
  if (villa.featured) return true;
  return villa.rating >= 4.8 && villa.reviewCount >= 20;
}

function hasPetFriendly(villa: Villa): boolean {
  return villa.amenities.some((a) => /pet/i.test(a));
}

export function VillaListItem({
  villa,
  loggedIn = false,
  inWishlist = false,
}: {
  villa: Villa;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  const visibleAmenities = villa.amenities.slice(0, SHOW_AMENITIES);
  const remaining = Math.max(0, villa.amenities.length - SHOW_AMENITIES);
  const bestRated = isBestRated(villa);
  const petFriendly = hasPetFriendly(villa);

  return (
    <article className="group relative grid grid-cols-1 overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md md:grid-cols-[420px_1fr_240px]">
      {/* IMAGE COLUMN — mobile uses 17:10 panoramic aspect; on desktop the
          image stretches to the full row height (driven by the middle column)
          so there's no empty area under the photo. object-cover keeps the
          composition. */}
      <Link
        href={`/villas/${villa.slug}`}
        className="relative aspect-[17/10] overflow-hidden bg-muted md:aspect-auto md:h-full"
      >
        <PhotoCarousel
          images={villa.images}
          sizes="(min-width: 768px) 440px, 100vw"
          counterStyle="text"
        />

        {/* Rating chip — bottom-right of the image, overlapping into the
            content area like the reference (StayVista). */}
        <div className="pointer-events-none absolute bottom-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold shadow-md ring-1 ring-black/5 backdrop-blur-sm">
          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
          <span className="font-numeric tabular-nums">
            {villa.rating.toFixed(1)}
          </span>
          <span className="text-muted-foreground">of 5</span>
        </div>

        {/* TOP-LEFT — Best Rated badge */}
        {bestRated && (
          <div className="absolute left-3 top-3 z-10">
            <span className="inline-flex items-center gap-1 rounded-md bg-foreground/85 px-2 py-1 text-[11px] font-semibold text-background backdrop-blur-sm">
              <Star className="h-3 w-3 fill-terracotta text-terracotta" />
              Best Rated
            </span>
          </div>
        )}

        {/* TOP-RIGHT — Wishlist + Share, vertically stacked, darker chip
            style to match the reference. */}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <WishlistButton
            slug={villa.slug}
            loggedIn={loggedIn}
            initialActive={inWishlist}
          />
          <ShareIconButton slug={villa.slug} villaName={villa.name} />
        </div>

        {/* BOTTOM-LEFT — image counter handled by PhotoCarousel's "text" style */}

        {/* BOTTOM-LEFT-ish — Pet friendly chip (above the carousel counter) */}
        {petFriendly && (
          <div
            className="pointer-events-none absolute bottom-12 left-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            title="Pet friendly"
          >
            <PawPrint className="h-3.5 w-3.5" />
          </div>
        )}

        {/* BOTTOM-CENTER — Video play icon, mirroring the reference */}
        {villa.video && (
          <div
            className="pointer-events-none absolute bottom-3 left-1/2 z-10 inline-flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm"
            title="Video tour available"
          >
            <PlayCircle className="h-4 w-4" />
          </div>
        )}
      </Link>

      {/* DETAILS MIDDLE COLUMN — extra padding so the column has substantial
          height (the image stretches to match this height). */}
      <div className="flex flex-col p-6 lg:p-7">
        <Link href={`/villas/${villa.slug}`}>
          <h3 className="font-display text-2xl font-bold leading-tight text-foreground transition-colors hover:text-terracotta">
            {villa.name}
          </h3>
        </Link>

        <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-terracotta" />
          <span>
            {villa.city ? `${villa.city}, ` : ""}
            {villa.state}
          </span>
        </div>

        {/* Specs row — each spec wraps as a unit (including its trailing
            separator) so we never get an orphaned ✦ at the start of a line. */}
        <div className="mt-3 flex flex-wrap items-center gap-y-1 text-sm text-foreground">
          {(
            [
              { Icon: Users, label: `Upto ${villa.maxGuests} Guests` },
              { Icon: BedDouble, label: `${villa.bedrooms} Rooms` },
              { Icon: Bath, label: `${villa.bathrooms} Baths` },
            ] as const
          ).map((s, i, arr) => (
            <span
              key={s.label}
              className="inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <s.Icon className="h-3.5 w-3.5" />
              {s.label}
              {i < arr.length - 1 && (
                <span className="mx-2 text-xs text-muted-foreground/60">✦</span>
              )}
            </span>
          ))}
        </div>

        {visibleAmenities.length > 0 && (
          <>
            {/* Thin divider between specs and amenities */}
            <div className="mt-4 border-t border-border/50" />
            {/* Tight grid layout — 4 amenities + N+ pill always fit in
                a single row, even when the middle column is narrow. */}
            <div className="mt-4 flex flex-nowrap items-start gap-x-3 overflow-hidden">
              {visibleAmenities.map((a) => {
                const Icon = getAmenityIcon(a);
                return (
                  <div
                    key={a}
                    className="flex w-12 shrink-0 flex-col items-center text-center"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background">
                      <Icon
                        className="h-4 w-4 text-foreground/80"
                        strokeWidth={1.6}
                      />
                    </div>
                    {/* Fixed 2-line label box keeps all icons row-aligned */}
                    <span className="mt-1.5 block min-h-[2.4em] text-[10px] leading-tight text-muted-foreground line-clamp-2">
                      {a}
                    </span>
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className="flex h-9 shrink-0 items-center self-start text-sm font-medium text-foreground/70">
                  {remaining}+
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* RIGHT COLUMN — mobile keeps the rooms-left / price-right split.
          Desktop stacks price on top and the rooms pill below it (column
          is narrow, vertical reads cleaner). Rating chip lives on the
          image above, so it's not duplicated here. */}
      <div className="flex flex-col border-t border-border/60 bg-muted/30 p-4 md:border-l md:border-t-0 lg:p-5">
        <div className="flex flex-1 items-center justify-between gap-3 md:flex-col-reverse md:items-center md:justify-center md:gap-3">
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground">
            <BedDouble className="h-3.5 w-3.5" />
            For {villa.bedrooms} {villa.bedrooms === 1 ? "Room" : "Rooms"}
          </span>
          <div className="text-right md:w-full md:text-center">
            <p className="font-numeric text-xl font-bold tracking-tight tabular-nums text-foreground md:text-2xl">
              {formatINR(villa.pricePerNight)}
            </p>
            <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground md:text-[11px]">
              Per Night + Taxes
              <br />
              ({villa.bedrooms} {villa.bedrooms === 1 ? "room" : "rooms"})
            </p>
          </div>
        </div>

        <Link
          href={`/villas/${villa.slug}`}
          className={buttonVariants({
            className: "mt-4 w-full justify-center rounded-md",
          })}
        >
          View →
        </Link>
      </div>
    </article>
  );
}
