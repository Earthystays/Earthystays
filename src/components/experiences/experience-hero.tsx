"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star, Clock, MapPin, ShieldCheck, Users, X, ChevronLeft, ChevronRight } from "lucide-react";
import type { Experience } from "@/lib/types";
import { WishlistButton } from "@/components/wishlist-button";
import { ShareButton } from "@/components/share-button";

export function ExperienceHero({
  e,
  categoryName,
  loggedIn = false,
  inWishlist = false,
}: {
  e: Experience;
  categoryName?: string;
  loggedIn?: boolean;
  inWishlist?: boolean;
}) {
  const gallery = e.gallery ?? [];
  const photos = gallery.length > 0 ? gallery : [e.image];
  // Desktop thumbnail grid: up to 3 photos + a "+N Photos" tile.
  const thumbs = gallery.slice(0, 3);
  const remaining = Math.max(0, gallery.length - thumbs.length);

  const [lightbox, setLightbox] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  function goPrev() {
    setLightbox((i) => (i === null ? null : (i - 1 + photos.length) % photos.length));
  }
  function goNext() {
    setLightbox((i) => (i === null ? null : (i + 1) % photos.length));
  }

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === "Escape") setLightbox(null);
      if (ev.key === "ArrowRight") goNext();
      if (ev.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, photos.length]);

  return (
    <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
      {/* Gallery — left on desktop, first on mobile */}
      <div className="flex min-w-0 flex-col gap-3">
        {/* Large featured image */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setLightbox(0)}
            className="relative block aspect-[4/3] w-full overflow-hidden rounded-[18px] bg-muted text-left"
          >
            <Image
              src={e.image.src}
              alt={e.image.alt}
              fill
              priority
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </button>
          <div className="absolute right-3 top-3 z-10 flex items-center gap-2">
            <ShareButton title={e.name} description={e.blurb} ariaLabel="Share this experience" />
            <WishlistButton
              slug={e.slug}
              loggedIn={loggedIn}
              initialActive={inWishlist}
              type="experience"
            />
          </div>
        </div>

        {gallery.length > 0 && (
          <>
            {/* Desktop: thumbnail grid */}
            <div className="hidden grid-cols-4 gap-3 lg:grid">
              {thumbs.map((p, i) => (
                <button
                  key={`${p.src}-${i}`}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="relative aspect-square overflow-hidden rounded-xl bg-muted"
                >
                  <Image src={p.src} alt={p.alt} fill sizes="12vw" className="object-cover" />
                </button>
              ))}
              <button
                type="button"
                onClick={() => setLightbox(thumbs.length)}
                className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-foreground text-sm font-medium text-background"
              >
                +{remaining > 0 ? remaining : gallery.length} Photos
              </button>
            </div>

            {/* Mobile: horizontal-scroll thumbnail strip */}
            <div className="flex gap-3 overflow-x-auto pb-1 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {gallery.map((p, i) => (
                <button
                  key={`${p.src}-${i}`}
                  type="button"
                  onClick={() => setLightbox(i)}
                  className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-xl bg-muted"
                >
                  <Image src={p.src} alt={p.alt} fill sizes="80px" className="object-cover" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Content — right on desktop, below gallery on mobile */}
      <div className="flex flex-col justify-center">
        {categoryName && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">
            {categoryName} experience
          </p>
        )}
        <h1 className="mt-3 font-title font-semibold text-4xl leading-[1.05] text-foreground sm:text-5xl">
          {e.hero?.title ?? e.name}
        </h1>
        {e.subtitle && (
          <p className="mt-3 font-display text-2xl italic text-terracotta">
            {e.subtitle}
          </p>
        )}
        <p className="mt-4 max-w-md text-muted-foreground">
          {e.hero?.description ?? e.blurb}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          {typeof e.rating === "number" && (
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 fill-terracotta text-terracotta" />
              <span className="font-numeric font-semibold tabular-nums">
                {e.rating.toFixed(1)}
              </span>
              {typeof e.reviewCount === "number" && (
                <a href="#reviews" className="text-muted-foreground underline underline-offset-2">
                  ({e.reviewCount} reviews)
                </a>
              )}
            </span>
          )}
          {e.duration && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-4 w-4" /> {e.duration}
            </span>
          )}
          {e.groupMax && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Users className="h-4 w-4" /> Up to {e.groupMax}
            </span>
          )}
          {e.privateAvailable && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="h-4 w-4" /> Private available
            </span>
          )}
          {e.meetingPoint && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {e.meetingPoint}
            </span>
          )}
        </div>
      </div>

      {lightbox !== null && photos[lightbox] && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {photos.length > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous"
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:left-4"
                onClick={(ev) => {
                  ev.stopPropagation();
                  goPrev();
                }}
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white hover:bg-white/20 sm:right-4"
                onClick={(ev) => {
                  ev.stopPropagation();
                  goNext();
                }}
              >
                <ChevronRight className="h-6 w-6" />
              </button>
              <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-medium text-white">
                {lightbox + 1} / {photos.length}
              </div>
            </>
          )}
          <div
            className="relative h-[80vh] w-full max-w-4xl touch-pan-y"
            onClick={(ev) => {
              ev.stopPropagation();
              if (photos.length <= 1) return;
              const rect = ev.currentTarget.getBoundingClientRect();
              const x = ev.clientX - rect.left;
              if (x < rect.width / 2) goPrev();
              else goNext();
            }}
            onTouchStart={(ev) => {
              touchStartX.current = ev.touches[0].clientX;
            }}
            onTouchEnd={(ev) => {
              if (touchStartX.current === null || photos.length <= 1) return;
              const dx = ev.changedTouches[0].clientX - touchStartX.current;
              touchStartX.current = null;
              if (Math.abs(dx) < 40) return;
              // Real swipe — navigate here and swallow the ghost click that
              // would otherwise fire next and double-navigate via tap-zones.
              ev.preventDefault();
              if (dx > 0) goPrev();
              else goNext();
            }}
          >
            <Image
              src={photos[lightbox].src}
              alt={photos[lightbox].alt}
              fill
              sizes="90vw"
              className="pointer-events-none object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
