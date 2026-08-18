import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ExperienceCard } from "@/components/experiences/experience-card";
import { ExperienceFilters } from "@/components/experiences/experience-filters";
import {
  filterExperiences,
  getExperiencesByCity,
  getExperienceCities,
  type ExperienceFilters as EF,
} from "@/lib/data/experiences";
import { getCategories } from "@/lib/data/experience-categories";
import { getCurrentUser } from "@/lib/session";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type Params = Promise<{ city: string }>;

function one(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { city } = await params;
  const match = getExperienceCities().find((c) => c.slug === city);
  const name = match?.name ?? city;
  return {
    title: `Experiences in ${name}`,
    description: `Host-led experiences in ${name} — curated by Earthy Stays.`,
  };
}

export default async function CityExperiencesPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { city } = await params;
  const sp = await searchParams;

  const cityExperiences = getExperiencesByCity(city);
  const cityMeta = getExperienceCities().find((c) => c.slug === city);
  if (cityExperiences.length === 0 && !cityMeta) notFound();

  const cityName = cityMeta?.name ?? cityExperiences[0]?.city ?? city;
  const categories = getCategories().filter((c) =>
    cityExperiences.some((e) => e.category === c.slug),
  );
  const languages = [
    ...new Set(cityExperiences.flatMap((e) => e.languages ?? [])),
  ].sort();

  const filters: EF = {
    q: one(sp.q),
    category: one(sp.category),
    difficulty: one(sp.difficulty),
    language: one(sp.language),
    privateOnly: one(sp.private) === "1",
    sort: one(sp.sort) as EF["sort"],
  };
  const results = filterExperiences(filters, cityExperiences);
  const catName = (slug?: string) => categories.find((c) => c.slug === slug)?.name;
  const user = await getCurrentUser();
  const wishlist = new Set(user?.wishlist ?? []);

  return (
    <div className="container-page py-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Experiences", href: "/experiences" },
          { label: cityName },
        ]}
      />

      <header className="mt-6 max-w-2xl">
        <p className="text-xs uppercase tracking-[0.22em] text-terracotta">
          {results.length} {results.length === 1 ? "experience" : "experiences"}
        </p>
        <h1 className="mt-3 font-display text-4xl sm:text-5xl">
          Experiences in {cityName}
        </h1>
      </header>

      <div className="mt-8">
        <ExperienceFilters
          categories={categories}
          cities={getExperienceCities()}
          languages={languages}
          lockedCity={city}
        />
      </div>

      {results.length > 0 ? (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
          <p className="font-display text-2xl">Nothing matches those filters</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <Link href={`/experiences/${city}`} className="text-terracotta underline">
              Clear filters
            </Link>{" "}
            or{" "}
            <Link href="/experiences" className="text-terracotta underline">
              browse all experiences
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
