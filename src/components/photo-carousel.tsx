"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Image as VillaImage } from "@/lib/types";

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
  /** Cap the number of photos shown in the preview. Defaults to 5 so
   *  listing cards don't drown the user in 20 dots. Set to a large number
   *  (or Infinity) to show everything. */
  maxImages?: number;
  /** "dots" = pip pagination at bottom centre (default).
   *  "text" = small "X / Y" pill at bottom-left (StayVista-style listing card). */
  counterStyle?: "dots" | "text";
}) {
  const shown = images.slice(0, Math.max(1, maxImages));
  const [i, setI] = useState(0);
  if (shown.length === 0) return null;

  function stopAndGo(fn: () => void) {
    return (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      fn();
    };
  }

  return (
    <div className={`group/carousel relative h-full w-full overflow-hidden ${className}`}>
      {shown.map((img, idx) => (
        <div
          key={img.src + idx}
          className={`absolute inset-0 transition-opacity duration-300 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={idx !== i}
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

      {shown.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous photo"
            onClick={stopAndGo(() => setI((p) => (p - 1 + shown.length) % shown.length))}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-all hover:bg-white group-hover/carousel:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next photo"
            onClick={stopAndGo(() => setI((p) => (p + 1) % shown.length))}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-foreground opacity-0 shadow-sm transition-all hover:bg-white group-hover/carousel:opacity-100"
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
                  onClick={stopAndGo(() => setI(idx))}
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
