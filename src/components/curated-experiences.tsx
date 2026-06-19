import Link from "next/link";
import { SectionHeader } from "@/components/section-header";
import { CallbackModal } from "@/components/callback-modal";
import { ExperiencesGrid } from "@/components/experiences-grid";
import type { Experience } from "@/lib/types";

/**
 * Curated Experiences — premium concierge section. Renders as a 4-column
 * grid on desktop, 2-col tablet, 1-col with horizontal swipe on mobile.
 * Clicking a card opens an inquiry modal (name + phone + experience
 * dropdown) instead of navigating away.
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

      <ExperiencesGrid experiences={experiences} variant="section" limit={8} />

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
