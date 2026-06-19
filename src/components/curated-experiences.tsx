import { SectionHeader } from "@/components/section-header";
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
    </section>
  );
}
