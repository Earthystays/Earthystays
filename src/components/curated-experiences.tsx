import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { CallbackModal } from "@/components/callback-modal";
import type { Experience } from "@/lib/types";

/**
 * Curated Experiences — premium concierge section. Renders as a 4-column
 * grid on desktop, 2-col tablet, 1-col with horizontal swipe on mobile.
 * Each card links to /experiences (the landing) for now; the concierge
 * banner below opens the existing Callback modal.
 */
export function CuratedExperiences({
  experiences,
}: {
  experiences: Experience[];
}) {
  if (experiences.length === 0) return null;

  return (
    <section className="container-page py-20">
      <SectionHeader
        eyebrow="More Than Just A Stay"
        title="Curated Experiences"
        description="Elevate your stay with handpicked experiences designed to make your getaway unforgettable."
        ctaLabel="View all"
        ctaHref="/experiences"
      />

      <div className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-4">
        {experiences.slice(0, 8).map((e) => (
          <Link
            key={e.slug}
            href={`/experiences/${e.slug}`}
            className="group relative aspect-[4/5] w-[68vw] shrink-0 snap-start overflow-hidden rounded-2xl bg-muted shadow-sm transition-all duration-500 hover:shadow-xl sm:w-auto sm:shrink"
          >
            <Image
              src={e.image.src}
              alt={e.image.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 68vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />
            <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-foreground shadow-sm transition-transform duration-300 group-hover:scale-110">
              <ArrowUpRight className="h-4 w-4" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
              <h3 className="font-display text-xl font-semibold leading-tight sm:text-2xl">
                {e.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-white/85 sm:text-sm">
                {e.blurb}
              </p>
              <span className="mt-3 inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/90 transition-[gap] duration-300 group-hover:gap-2">
                Explore <span aria-hidden>→</span>
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Concierge banner */}
      <div className="mt-12 overflow-hidden rounded-3xl bg-foreground text-background">
        <div className="flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-12 sm:py-16">
          <p className="text-xs uppercase tracking-[0.22em] text-terracotta/90">
            Concierge desk
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            Need Something Special?
          </h2>
          <p className="max-w-xl text-sm text-background/75 sm:text-base">
            Our concierge team can help arrange personalized experiences for
            your stay.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/experiences"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Explore experiences
            </Link>
            <CallbackModal
              triggerLabel="Contact concierge"
              showIcon={false}
              triggerClassName="inline-flex items-center justify-center rounded-full border border-background/40 px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background/10 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
