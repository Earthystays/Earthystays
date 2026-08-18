import Link from "next/link";
import { Star, Clock, MapPin, ArrowUpRight } from "lucide-react";
import type { Experience } from "@/lib/types";
import { formatINR } from "@/lib/format";
import { experienceHref } from "@/lib/data/experiences";
import { PhotoCarousel } from "@/components/photo-carousel";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareIconButton } from "@/components/share-icon-button";

export function ExperienceCard({
  experience,
  categoryName,
  loggedIn = false,
  inWishlist = false,
}: {
  experience: Experience;
  /** Display name for the category badge (resolved by the caller). */
  categoryName?: string;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  const e = experience;
  const location =
    e.city && e.state && e.city !== e.state
      ? `${e.city}, ${e.state}`
      : e.city || e.state || "";
  const photos = e.gallery && e.gallery.length > 0 ? e.gallery : [e.image];

  return (
    <Link
      href={experienceHref(e)}
      className="group block overflow-hidden rounded-[18px] bg-card border border-border/60 transition-all hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <PhotoCarousel
          images={photos}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          counterStyle="dots"
        />
        {categoryName && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
            {categoryName}
          </span>
        )}
        <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
          <WishlistButton
            slug={e.slug}
            loggedIn={loggedIn}
            initialActive={inWishlist}
            type="experience"
          />
          <ShareIconButton
            slug={e.slug}
            villaName={e.name}
            path={experienceHref(e)}
            ariaLabel="Share this experience"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] flex items-end justify-between bg-gradient-to-t from-black/45 to-transparent p-4">
          {typeof e.rating === "number" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-medium text-foreground">
              <Star className="h-3 w-3 fill-terracotta text-terracotta" />
              {e.rating.toFixed(1)}
              {typeof e.reviewCount === "number" && (
                <span className="text-muted-foreground">· {e.reviewCount}</span>
              )}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-foreground/95 px-3 py-1.5 text-xs font-semibold text-background opacity-90 transition-opacity group-hover:opacity-100">
            View
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {location}
            </span>
          )}
          {e.duration && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> {e.duration}
            </span>
          )}
        </div>
        <h3 className="mt-1.5 font-title font-semibold text-xl text-foreground">{e.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{e.blurb}</p>

        <div className="mt-4 flex items-baseline justify-between">
          <p className="text-sm text-foreground">
            <span className="text-xs text-muted-foreground">From </span>
            <span className="font-numeric font-semibold tabular-nums">
              {formatINR(e.priceFrom ?? 0)}
            </span>
            <span className="text-xs text-muted-foreground"> / person</span>
          </p>
          <span className="text-xs uppercase tracking-wider text-terracotta transition-transform group-hover:translate-x-0.5">
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
