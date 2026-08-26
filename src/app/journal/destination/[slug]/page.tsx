import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getJournalDestinationBySlug,
  getEnabledJournalDestinations,
} from "@/lib/data/journal-destinations";
import { getArticlesByDestination } from "@/lib/data/journal";
import { getVillaBySlug } from "@/lib/data/villas";
import { getPublishedExperienceBySlug } from "@/lib/data/experiences";
import { ArticleCard } from "@/components/journal/article-card";
import {
  PropertyEmbedCard,
  ExperienceEmbedCard,
} from "@/components/journal/embed-cards";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/jsonld-breadcrumb";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getEnabledJournalDestinations().map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const d = getJournalDestinationBySlug(slug);
  if (!d) return { title: "Destination not found" };
  const seo = d.seo ?? {};
  return {
    title: seo.title || `${d.name} — The Earthy Journal`,
    description: seo.description || d.description,
    alternates: { canonical: `/journal/destination/${d.slug}` },
  };
}

export default async function DestinationPage({ params }: PageProps) {
  const { slug } = await params;
  const d = getJournalDestinationBySlug(slug);
  if (!d || !d.enabled) notFound();

  const articles = getArticlesByDestination(d.slug);
  const villas = (d.relatedPropertySlugs ?? [])
    .map((s) => getVillaBySlug(s))
    .filter((v): v is NonNullable<typeof v> => Boolean(v));
  const experiences = (d.relatedExperienceSlugs ?? [])
    .map((s) => getPublishedExperienceBySlug(s))
    .filter((e): e is NonNullable<typeof e> => Boolean(e));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Journal", href: "/journal" },
    { label: d.name, href: `/journal/destination/${d.slug}` },
  ];

  return (
    <div className="bg-background">
      <BreadcrumbJsonLd items={crumbs} />

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-forest-deep">
        {d.image && (
          <Image src={d.image.src} alt={d.image.alt} fill priority sizes="100vw" className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
        <div className="container-page relative flex min-h-[360px] flex-col justify-end py-12">
          {d.location && (
            <p className="text-xs uppercase tracking-[0.2em] text-white/80">{d.location}</p>
          )}
          <h1 className="mt-2 font-serif text-5xl text-white sm:text-6xl">{d.name}</h1>
          {d.description && (
            <p className="mt-4 max-w-xl text-lg text-white/90">{d.description}</p>
          )}
        </div>
      </section>

      <div className="container-page py-6">
        <Breadcrumbs items={crumbs} />
      </div>

      {/* Stories */}
      <section className="container-page pb-8">
        <h2 className="font-serif text-2xl text-foreground sm:text-3xl">Stories from {d.name}</h2>
        {articles.length ? (
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <p className="mt-6 text-muted-foreground">Stories from {d.name} are coming soon.</p>
        )}
      </section>

      {villas.length > 0 && (
        <section className="container-page py-8">
          <h2 className="font-serif text-2xl text-foreground sm:text-3xl">Where to stay in {d.name}</h2>
          <div className="mt-6">
            {villas.map((v) => (
              <PropertyEmbedCard key={v.slug} villa={v} />
            ))}
          </div>
        </section>
      )}

      {experiences.length > 0 && (
        <section className="container-page py-8 pb-16">
          <h2 className="font-serif text-2xl text-foreground sm:text-3xl">Things to do in {d.name}</h2>
          <div className="mt-6">
            {experiences.map((e) => (
              <ExperienceEmbedCard key={e.slug} exp={e} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
