import Image from "next/image";
import Link from "next/link";
import type { Image as VillaImage } from "@/lib/types";
import { Images, Star, PlayCircle } from "lucide-react";
import { ShareButton } from "@/components/share-button";
import { WishlistButton } from "@/components/wishlist-button";
import { PhotoCarousel } from "@/components/photo-carousel";

export function VillaGallery({
  images,
  slug,
  villaName,
  rating,
  reviewCount,
  pricePerNight,
  hasVideo = false,
  loggedIn = false,
  inWishlist = false,
}: {
  images: VillaImage[];
  slug: string;
  villaName?: string;
  rating?: number;
  reviewCount?: number;
  pricePerNight?: number;
  hasVideo?: boolean;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  if (images.length === 0) return null;

  const photosUrl = `/villas/${slug}/photos`;
  const main = images[0];
  const top = images[1] ?? main;
  const bottom = images[2] ?? main;
  const moreCount = Math.max(0, images.length - 3);
  const isBestRated = typeof rating === "number" && rating >= 4.85;
  const isLuxury = typeof pricePerNight === "number" && pricePerNight >= 50000;

  return (
    <>
      {/* MOBILE — swipeable carousel of all images, with share/wishlist
          overlay and a "View Photos" CTA. Hidden on desktop. */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:hidden">
        <PhotoCarousel
          images={images}
          sizes="100vw"
          priority
          maxImages={Math.min(images.length, 8)}
          counterStyle="text"
        />
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <ShareButton
            title={villaName ?? "Earthy Stays villa"}
            description={villaName ? `${villaName} — book on Earthy Stays` : "Earthy Stays"}
          />
          <WishlistButton
            slug={slug}
            loggedIn={loggedIn}
            initialActive={inWishlist}
          />
        </div>
        {isBestRated && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-medium text-foreground shadow-sm backdrop-blur">
            <Star className="h-3 w-3 fill-terracotta text-terracotta" />
            Best Rated
          </span>
        )}
        <Link
          href={photosUrl}
          className="absolute bottom-3 right-3 z-10 inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3 py-1.5 text-xs font-medium text-foreground shadow-md backdrop-blur"
        >
          <Images className="h-3.5 w-3.5" />
          All {images.length} photos
        </Link>
      </div>

      {/* DESKTOP — original 1+2 grid */}
      <div className="hidden h-[78vh] min-h-[560px] gap-2.5 sm:grid sm:grid-cols-[1.6fr_1fr] sm:grid-rows-2">
      {/* MAIN — left, spans 2 rows */}
      <Link
        href={photosUrl}
        className="group relative col-span-1 row-span-1 sm:row-span-2 overflow-hidden rounded-xl bg-muted"
        aria-label="View all photos"
      >
        <Image
          src={main.src}
          alt={main.alt}
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />

        {/* Badges — top-left, stacked horizontally */}
        <div className="absolute left-4 top-4 flex flex-wrap items-center gap-2">
          {isBestRated && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              <Star className="h-3 w-3 fill-terracotta text-terracotta" />
              Best Rated
            </span>
          )}
          {isLuxury && (
            <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur">
              Luxury
            </span>
          )}
        </div>

        {/* CTA buttons — bottom-right corner, side-by-side */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          {hasVideo && (
            <span
              className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3.5 py-2 text-sm font-medium text-foreground shadow-md backdrop-blur transition-transform group-hover:scale-105"
              role="button"
            >
              <PlayCircle className="h-4 w-4" /> View Video
            </span>
          )}
          <span className="inline-flex items-center gap-1.5 rounded-md bg-white/95 px-3.5 py-2 text-sm font-medium text-foreground shadow-md backdrop-blur transition-transform group-hover:scale-105">
            <Images className="h-4 w-4" /> View Photos
          </span>
        </div>
      </Link>

      {/* TOP RIGHT — with share + wishlist overlay */}
      <Link
        href={photosUrl}
        className="group relative hidden sm:block overflow-hidden rounded-xl bg-muted"
        aria-label="View all photos"
      >
        <Image
          src={top.src}
          alt={top.alt}
          fill
          sizes="(min-width: 1024px) 30vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
          <ShareButton
            title={villaName ?? "Earthy Stays villa"}
            description={villaName ? `${villaName} — book on Earthy Stays` : "Earthy Stays"}
          />
          <WishlistButton
            slug={slug}
            loggedIn={loggedIn}
            initialActive={inWishlist}
          />
        </div>
        {top.tag && (
          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
            {top.tag}
          </span>
        )}
      </Link>

      {/* BOTTOM RIGHT — with +N More overlay */}
      <Link
        href={photosUrl}
        className="group relative hidden sm:block overflow-hidden rounded-xl bg-muted"
        aria-label={moreCount > 0 ? `View ${moreCount} more photos` : "View all photos"}
      >
        <Image
          src={bottom.src}
          alt={bottom.alt}
          fill
          sizes="(min-width: 1024px) 30vw, 50vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
        />
        {moreCount > 0 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-white">
            <span className="font-numeric text-3xl font-semibold sm:text-4xl">+{moreCount} More</span>
          </div>
        ) : (
          bottom.tag && (
            <span className="absolute bottom-3 left-3 inline-flex items-center rounded-md bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur">
              {bottom.tag}
            </span>
          )
        )}
        {reviewCount !== undefined && reviewCount > 0 && moreCount === 0 && (
          <span className="sr-only">{reviewCount} reviews</span>
        )}
      </Link>
      </div>
    </>
  );
}
