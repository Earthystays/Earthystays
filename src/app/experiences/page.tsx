import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CallbackModal } from "@/components/callback-modal";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { ExperienceFilters } from "@/components/experiences/experience-filters";
import {
  filterExperiences,
  getPublishedExperiences,
  getExperienceCities,
  type ExperienceFilters as EF,
} from "@/lib/data/experiences";
import { getCategories } from "@/lib/data/experience-categories";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Experiences",
  description:
    "Handpicked, host-led experiences across Goa — heritage food walks, sunset cruises, spice trails, cooking classes and more. Curated by Earthy Stays.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function ExperiencesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const all = getPublishedExperiences();
  const categories = getCategories().filter((c) =>
    all.some((e) => e.category === c.slug),
  );
  const cities = getExperienceCities();
  const languages = [...new Set(all.flatMap((e) => e.languages ?? []))].sort();

  const filters: EF = {
    q: one(sp.q),
    category: one(sp.category),
    city: one(sp.city),
    difficulty: one(sp.difficulty),
    language: one(sp.language),
    privateOnly: one(sp.private) === "1",
    sort: one(sp.sort) as EF["sort"],
  };
  const results = filterExperiences(filters, all);
  const catName = (slug?: string) => categories.find((c) => c.slug === slug)?.name;
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div>
      <div className="container-page py-8 lg:py-10">
        <Breadcrumbs
          items={[{ label: "Home", href: "/" }, { label: "Experiences" }]}
        />
        <h1 className="sr-only">Experiences</h1>

        <div className="mt-6">
          <ExperienceFilters
            categories={categories}
            cities={cities}
            languages={languages}
          />
        </div>

        <p className="mt-8 text-sm text-muted-foreground">
          {results.length} {results.length === 1 ? "experience" : "experiences"}
        </p>

        {results.length > 0 ? (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((e) => (
              <ExperienceCard
                key={e.slug}
                experience={e}
                categoryName={catName(e.category)}
                loggedIn={!!user}
                inWishlist={wishlist.has(e.slug)}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-border/70 p-12 text-center">
            <p className="font-display text-2xl">No experiences match those filters</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try clearing a filter, or{" "}
              <Link href="/experiences" className="text-terracotta underline">
                view all experiences
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <section className="container-page pb-20">
        <div className="overflow-hidden rounded-3xl bg-foreground text-background">
          <div className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:px-12 sm:py-16">
            <p className="text-xs uppercase tracking-[0.22em] text-terracotta/90">
              Concierge desk
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">
              Looking for something bespoke?
            </h2>
            <p className="max-w-xl text-sm text-background/75 sm:text-base">
              Tell us your dates, group and what you have in mind — our concierge
              builds a shortlist within the day.
            </p>
            <div className="mt-2">
              <CallbackModal
                triggerLabel="Contact concierge"
                showIcon={false}
                triggerClassName="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
