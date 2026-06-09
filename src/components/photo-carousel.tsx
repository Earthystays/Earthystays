"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Image as VillaImage } from "@/lib/types";

/**
 * Card photo carousel with native swipe support.
 * Uses CSS scroll-snap so phone users can swipe naturally — no JS needed
 * for the gesture itself. The visible page index is derived from
 * scrollLeft, so dots and "X / Y" counter stay accurate as the user swipes.
 */
export function PhotoCarousel({
  images,
  sizes,
  priority = false,
  className = "",
  maxImages = 5,
  counterStyle = "dots",
}: {
  images: VillaImage[];
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Cap the number of photos in the preview. Defaults to 5. */
  maxImages?: number;
  /** "dots" = pip pagination centre-bottom; "text" = "X / Y" pill bottom-left. */
  counterStyle?: "dots" | "text";
}) {
  const shown = images.slice(0, Math.max(1, maxImages));
  const [i, setI] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Sync visible index to scroll position (handles swipe + button-driven scroll)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    let raf = 0;
    function onScroll() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!el || el.clientWidth === 0) return;
        const idx = Math.round(el.scrollLeft / el.clientWidth);
        setI((prev) => (prev === idx ? prev : idx));
      });
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  function goTo(idx: number) {
    const el = scrollerRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(shown.length - 1, idx));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
  }

  // React 19's lint flags refs being accessed when the handler is created
  // (vs when it fires). We keep goTo() — which touches scrollerRef — inside
  // the actual click event by inlining onClick handlers below instead of
  // using a factory like stopAndGo().

  if (shown.length === 0) return null;

  return (
    <div className={`group/carousel relative h-full w-full overflow-hidden ${className}`}>
      <div
        ref={scrollerRef}
        className="flex h-full snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((img, idx) => (
          <div
            key={img.src + idx}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes={sizes}
              priority={idx === 0 && priority}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {shown.length > 1 && (
        <>
          {/* Arrows — visible on desktop hover, hidden on mobile (swipe instead) */}
          <button
            type="button"
            aria-label="Previous photo"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(i - 1);
            }}
            className="absolute left-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-all hover:bg-white group-hover/carousel:opacity-100 sm:inline-flex"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(i + 1);
            }}
            className="absolute right-2 top-1/2 z-10 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-all hover:bg-white group-hover/carousel:opacity-100 sm:inline-flex"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {counterStyle === "dots" ? (
            <div className="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
              {shown.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Go to photo ${idx + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    goTo(idx);
                  }}
                  className={`h-1.5 rounded-full transition-all ${
                    idx === i ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/80"
                  }`}
                />
              ))}
            </div>
          ) : (
            <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-md bg-black/65 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
              {i + 1} / {shown.length}
            </div>
          )}
        </>
      )}
    </div>
  );
}
