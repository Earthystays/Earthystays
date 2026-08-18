import { SectionHeader } from "@/components/section-header";
import { ScrollSlider } from "@/components/scroll-slider";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { getCategoryBySlug } from "@/lib/data/experience-categories";
import type { Experience } from "@/lib/types";

/**
 * Curated Experiences — home-page section surfacing published marketplace
 * experiences. Cards deep-link to the experience detail page. Horizontal
 * swipe on mobile, responsive grid on desktop.
 */
export function CuratedExperiences({
  experiences,
}: {
  experiences: Experience[];
}) {
  if (experiences.length === 0) return null;
  const items = experiences.slice(0, 8);

  return (
    <section className="container-page py-20">
      <SectionHeader
        eyebrow="More Than Just A Stay"
        title="Curated Experiences"
        ctaLabel="View all"
        ctaHref="/experiences"
      />

      <ScrollSlider className="mt-10 -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-pl-5 px-5 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-5 sm:scroll-pl-6 sm:px-6 sm:-mx-6 lg:scroll-pl-8 lg:px-8 lg:-mx-8">
        {items.map((e) => (
          <div
            key={e.slug}
            className="w-[72vw] shrink-0 snap-start sm:w-[44vw] lg:w-[calc((100%-3.75rem)/4)]"
          >
            <ExperienceCard
              experience={e}
              categoryName={getCategoryBySlug(e.category ?? "")?.name}
            />
          </div>
        ))}
      </ScrollSlider>
    </section>
  );
}
