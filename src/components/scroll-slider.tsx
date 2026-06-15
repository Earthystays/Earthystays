"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal scroller with auto-hiding prev/next arrows. Arrows appear when
 * there's overflow in that direction (so on a short list with everything
 * already visible, no arrows show). Click scrolls by ~90% of the visible
 * width, which lines up with the next "page" of cards.
 */
export function ScrollSlider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setCanLeft(el.scrollLeft > 4);
      setCanRight(
        Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 4,
      );
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  function scrollByDir(dir: -1 | 1) {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div ref={ref} className={className}>
        {children}
      </div>

      {canLeft && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByDir(-1)}
          className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-white sm:inline-flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}
      {canRight && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByDir(1)}
          className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-white sm:inline-flex"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
