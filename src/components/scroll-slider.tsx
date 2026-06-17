"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Horizontal scroller with wrap-around prev/next arrows. Both arrows stay
 * visible whenever the content is wider than the viewport — clicking next
 * past the last card jumps back to the first, and clicking prev at the
 * start jumps to the end. If everything already fits, no arrows show.
 */
export function ScrollSlider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scrollable, setScrollable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    function update() {
      if (!el) return;
      setScrollable(el.scrollWidth > el.clientWidth + 4);
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
    const maxScroll = el.scrollWidth - el.clientWidth;
    const step = el.clientWidth * 0.9;

    if (dir === 1) {
      if (el.scrollLeft + step >= maxScroll - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    } else {
      if (el.scrollLeft <= 4) {
        el.scrollTo({ left: maxScroll, behavior: "smooth" });
      } else {
        el.scrollBy({ left: -step, behavior: "smooth" });
      }
    }
  }

  return (
    <div className="relative isolate">
      <div ref={ref} className={className}>
        {children}
      </div>

      {scrollable && (
        <>
          <button
            type="button"
            aria-label="Scroll left"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollByDir(-1);
            }}
            className="pointer-events-auto absolute left-1 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-white sm:left-2 sm:h-10 sm:w-10"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scrollByDir(1);
            }}
            className="pointer-events-auto absolute right-1 top-1/2 z-30 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-foreground shadow-lg ring-1 ring-black/10 transition-colors hover:bg-white sm:right-2 sm:h-10 sm:w-10"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </>
      )}
    </div>
  );
}
