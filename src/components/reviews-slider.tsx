"use client";

import { useEffect, useRef } from "react";
import { Star } from "lucide-react";
import type { StoredReview } from "@/lib/data/reviews";

/**
 * Home page testimonials carousel — horizontal snap-scroll, autoplays every
 * 6 seconds (pauses when hovered), swipe-friendly on mobile.
 */
export function ReviewsSlider({ reviews }: { reviews: StoredReview[] }) {
  const scroller = useRef<HTMLDivElement | null>(null);

  // Autoplay — pauses on hover or while user is dragging
  useEffect(() => {
    const el = scroller.current;
    if (!el || reviews.length <= 1) return;
    let paused = false;
    const onEnter = () => (paused = true);
    const onLeave = () => (paused = false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);

    const interval = setInterval(() => {
      if (paused || !el) return;
      const step = Math.round(el.clientWidth * 0.85);
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 4) {
        el.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        el.scrollBy({ left: step, behavior: "smooth" });
      }
    }, 6000);

    return () => {
      clearInterval(interval);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [reviews]);

  if (reviews.length === 0) return null;

  return (
    <div className="mt-12">
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: StoredReview }) {
  const subtitle = [review.villaName, review.location].filter(Boolean).join(", ");
  return (
    <figure className="w-[85%] shrink-0 snap-center rounded-2xl border border-border/60 bg-card p-7 sm:w-[calc(50%-12px)] lg:w-[calc(33.3333%-16px)]">
      <div className="flex gap-0.5 text-terracotta">
        {Array.from({ length: 5 }).map((_, j) => (
          <Star
            key={j}
            className={`h-4 w-4 ${j < review.rating ? "fill-terracotta" : "fill-none opacity-30"}`}
          />
        ))}
      </div>
      <blockquote className="mt-4 line-clamp-6 font-display text-lg leading-snug text-foreground">
        &ldquo;{review.quote}&rdquo;
      </blockquote>
      <figcaption className="mt-5 text-xs uppercase tracking-wider text-muted-foreground">
        {review.guestName}
        {subtitle && <span> · {subtitle}</span>}
      </figcaption>
    </figure>
  );
}
