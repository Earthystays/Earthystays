import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { WhereToStay } from "@/components/connect/where-to-stay";
import { staysForExperience } from "@/lib/connect/relevance";
import { DetailTabs, type DetailTab } from "@/components/detail-tabs";
import { GuestReviews } from "@/components/reviews/guest-reviews";
import { computeReviewSummary, getReviewsByExperience } from "@/lib/data/reviews";
import { ExperienceHero } from "@/components/experiences/experience-hero";
import { ExperienceInquiryCard } from "@/components/experiences/experience-inquiry-card";
import { ExperienceMobileBar } from "@/components/experiences/experience-mobile-bar";
import { ExperienceViewTracker } from "@/components/experiences/experience-view-tracker";
import { ExperienceJsonLd } from "@/components/experiences/experience-jsonld";
import { ExperienceCard } from "@/components/experiences/experience-card";
import {
  Section,
  ExperienceFaq,
  QuickInfoCards,
  ExperienceHighlights,
  ExperienceTimeline,
  AboutHost,
  IncludedExcluded,
  ThingsToCarry,
} from "@/components/experiences/experience-detail-sections";
import {
  getPublishedExperiences,
  getPublishedExperienceBySlug,
  getRelated,
  experienceHref,
} from "@/lib/data/experiences";
import { getHostById } from "@/lib/data/experience-hosts";
import { getCategoryBySlug } from "@/lib/data/experience-categories";
import { getCurrentUser } from "@/lib/session";

type Params = Promise<{ city: string; slug: string }>;

export async function generateStaticParams() {
  return getPublishedExperiences().map((e) => ({
    city: e.citySlug || "goa",
    slug: e.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const e = getPublishedExperienceBySlug(slug);
  if (!e) return { title: "Experience not found" };
  const title = e.metaTitle || e.name;
  const description =
    e.metaDescription || e.blurb || e.hero?.description || `${e.name} — an Earthy Stays experience.`;
  const image = e.ogImage || e.image.src;
  const url = experienceHref(e);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "Earthy Stays",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ExperienceDetailPage({
  params,
}: {
  params: Params;
}) {
  const { city, slug } = await params;
  const e = getPublishedExperienceBySlug(slug);
  if (!e) notFound();

  // Canonicalize the city segment: a real slug reached under the wrong city
  // (e.g. /experiences/wrongcity/old-goa-food-walk) 308-redirects to the
  // canonical URL instead of serving duplicate content.
  const canonicalCity = e.citySlug || "goa";
  if (city !== canonicalCity) redirect(experienceHref(e));

  // Host section temporarily hidden — flip to true to re-enable (tab + section).
  const SHOW_HOST = false;

  const category = getCategoryBySlug(e.category ?? "");
  const host = getHostById(e.hostId);
  const related = getRelated(e);
  // Experience → property cross-sell, matched on destination.
  const nearbyStays = staysForExperience(e, 3);
  const catName = (s?: string) => getCategoryBySlug(s ?? "")?.name;

  const reviews = getReviewsByExperience(e.slug);
  const summary = computeReviewSummary(reviews);
  const user = await getCurrentUser();

  // Tabs adapt to the content that actually exists.
  const tabs: DetailTab[] = [{ id: "overview", label: "Overview" }];
  if (e.highlights?.length) tabs.push({ id: "highlights", label: "Highlights" });
  if (e.itinerary?.length) tabs.push({ id: "journey", label: "Your Journey" });
  if (SHOW_HOST && host) tabs.push({ id: "host", label: "Host" });
  if (e.included?.length || e.excluded?.length)
    tabs.push({ id: "inclusions", label: "Inclusions" });
  tabs.push({ id: "reviews", label: "Reviews" });
  if (e.faqs?.length) tabs.push({ id: "faqs", label: "FAQ's" });

  return (
    <div>
      <ExperienceJsonLd e={e} />
      <ExperienceViewTracker slug={e.slug} />

      <div className="container-page pt-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Experiences", href: "/experiences" },
            ...(e.city
              ? [{ label: e.city, href: `/experiences/${e.citySlug || "goa"}` }]
              : []),
            { label: e.name },
          ]}
        />
      </div>

      <div className="container-page mt-6">
        <ExperienceHero
          e={e}
          categoryName={category?.name}
          loggedIn={!!user}
          inWishlist={(user?.wishlist ?? []).includes(e.slug)}
        />
      </div>

      {/* Sticky section tabs — rendered as a direct child of the page root
          (not a tightly-fit wrapper div) so its containing block spans the
          full page height; see the villa detail page for the same fix. */}
      <DetailTabs tabs={tabs} />

      <div className="container-page mb-28 mt-8 grid gap-12 lg:mb-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-14">
          {(e.overview || e.blurb) && (
            <Section id="overview" title="Overview">
              <p className="whitespace-pre-line leading-relaxed text-muted-foreground">
                {e.overview ?? e.blurb}
              </p>
            </Section>
          )}

          <Section id="quick-info" title="Good to know">
            <QuickInfoCards e={e} />
          </Section>

          {e.highlights && e.highlights.length > 0 && (
            <Section id="highlights" title="Experience Highlights">
              <ExperienceHighlights items={e.highlights} />
            </Section>
          )}

          {e.itinerary && e.itinerary.length > 0 && (
            <Section id="journey" title="Your Journey">
              <ExperienceTimeline stops={e.itinerary} />
            </Section>
          )}

          {SHOW_HOST && host && (
            <Section id="host" title="About Your Host">
              <AboutHost host={host} />
            </Section>
          )}

          {(e.included?.length || e.excluded?.length) && (
            <Section id="inclusions" title="What's Included">
              <IncludedExcluded included={e.included} excluded={e.excluded} />
            </Section>
          )}

          {e.thingsToCarry && e.thingsToCarry.length > 0 && (
            <Section id="carry" title="Things to Carry">
              <ThingsToCarry items={e.thingsToCarry} />
            </Section>
          )}

          <Section id="reviews" title="Guest Reviews">
            <GuestReviews
              experienceSlug={e.slug}
              villaName={e.name}
              reviewPath={`${experienceHref(e)}#reviews`}
              reviews={reviews}
              summary={summary}
              fallbackRating={e.rating ?? 0}
              fallbackCount={e.reviewCount ?? 0}
              viewer={user ? { name: user.name, email: user.email } : null}
            />
          </Section>

          {e.faqs && e.faqs.length > 0 && (
            <Section id="faqs" title="FAQ's">
              <div className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card">
                {e.faqs.map((f, i) => (
                  <ExperienceFaq key={i} question={f.question}>
                    {f.answer}
                  </ExperienceFaq>
                ))}
              </div>
            </Section>
          )}
        </div>

        {/* Sticky inquiry */}
        <aside className="hidden self-start lg:sticky lg:top-32 lg:block">
          <ExperienceInquiryCard
            experienceSlug={e.slug}
            experienceName={e.name}
            priceFrom={e.priceFrom}
            city={e.city}
          />
        </aside>
      </div>

      <WhereToStay villas={nearbyStays} placeName={e.city ?? e.state} />

      {related.length > 0 && (
        <section className="container-page mb-28 mt-24 lg:mb-16">
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            You May Also Like
          </h2>
          <div className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 sm:grid sm:gap-6 sm:overflow-visible sm:grid-cols-2 lg:grid-cols-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {related.map((r) => (
              <div key={r.slug} className="w-[75%] shrink-0 snap-start sm:w-auto">
                <ExperienceCard
                  experience={r}
                  categoryName={catName(r.category)}
                  loggedIn={!!user}
                  inWishlist={(user?.wishlist ?? []).includes(r.slug)}
                />
              </div>
            ))}
          </div>
        </section>
      )}

      <ExperienceMobileBar
        experienceSlug={e.slug}
        experienceName={e.name}
        priceFrom={e.priceFrom}
        city={e.city}
      />
    </div>
  );
}
