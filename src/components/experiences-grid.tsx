"use client";

import { useState } from "react";
import Image from "next/image";
import { ExperienceInquiryModal } from "@/components/experience-inquiry-modal";
import type { Experience } from "@/lib/types";

/**
 * Renders experience cards as buttons that open the inquiry modal with
 * the clicked experience pre-selected. Used on both the home page
 * Curated Experiences section and the /experiences listing page.
 */
export function ExperiencesGrid({
  experiences,
  variant = "list",
  limit,
}: {
  experiences: Experience[];
  /** "section" = home page section (snap-scroll on mobile, 4-col grid on
   *  desktop). "list" = standalone /experiences page (4-col responsive
   *  grid, no snap-scroll). */
  variant?: "section" | "list";
  limit?: number;
}) {
  const visible = typeof limit === "number" ? experiences.slice(0, limit) : experiences;
  const [open, setOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  function pick(slug: string) {
    setActiveSlug(slug);
    setOpen(true);
  }

  const gridClasses =
    variant === "section"
      ? "mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5"
      : "mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <>
      <div className={gridClasses}>
        {visible.map((e) => (
          <button
            key={e.slug}
            type="button"
            onClick={() => pick(e.slug)}
            className={`group relative aspect-[4/5] shrink-0 cursor-pointer snap-start overflow-hidden rounded-2xl bg-muted text-left shadow-sm transition-all duration-500 hover:shadow-xl ${
              variant === "section"
                ? "w-[68vw] sm:w-[42vw] lg:w-[calc((100%-3.75rem)/4)]"
                : "w-[68vw] sm:w-auto sm:shrink"
            }`}
            aria-label={`Inquire about ${e.name}`}
          >
            <Image
              src={e.image.src}
              alt={e.image.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 68vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <h3 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
                {e.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">
                {e.blurb}
              </p>
            </div>
          </button>
        ))}
      </div>

      <ExperienceInquiryModal
        experiences={experiences}
        open={open}
        onOpenChange={setOpen}
        initialSlug={activeSlug}
      />
    </>
  );
}
