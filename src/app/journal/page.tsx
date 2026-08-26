import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Palmtree,
  BookOpen,
  Home as HomeIcon,
  Camera,
  UtensilsCrossed,
  Briefcase,
  MapPin,
  Leaf,
  ArrowRight,
} from "lucide-react";

function InstagramGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
import type { HomepageSectionKey } from "@/lib/journal/types";
import { getHomepage } from "@/lib/data/journal-homepage";
import { getEnabledCategories } from "@/lib/data/journal-categories";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";
import { getEditorsPicks, getLatestArticles } from "@/lib/data/journal";
import { getFeaturedVillas, getVillaBySlug } from "@/lib/data/villas";
import {
  getPublishedExperiences,
  getExperienceBySlug,
} from "@/lib/data/experiences";
import { getActiveCampaign } from "@/lib/data/journal-campaigns";
import { ArticleCard } from "@/components/journal/article-card";
import { NewsletterForm } from "@/components/journal/newsletter-form";
import { CampaignBanner } from "@/components/journal/campaign-banner";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Earthy Journal — Travel stories, guides & inspiration",
  description:
    "Stories, guides and places worth discovering across Goa and beyond. Curated for travellers, by the locals.",
  alternates: { canonical: "/journal" },
  openGraph: {
    title: "The Earthy Journal",
    description:
      "Stories, guides and places worth discovering. Curated for travellers, by the locals.",
    type: "website",
  },
};

const CATEGORY_ICONS: Record<string, typeof Palmtree> = {
  goa: Palmtree,
  "travel-guides": BookOpen,
  "villa-guides": HomeIcon,
  experiences: Camera,
  "food-and-drink": UtensilsCrossed,
  "weekend-getaways": Briefcase,
  "travel-tips": MapPin,
  "earthy-stories": Leaf,
};

export default function JournalHomePage() {
  const cfg = getHomepage();
  const campaign = getActiveCampaign();

  const sections: Record<HomepageSectionKey, React.ReactNode> = {
    hero: cfg.hero.enabled ? <Hero cfg={cfg.hero} /> : null,
    categories: cfg.categoriesEnabled ? <CategoryNav /> : null,
    editorsPicks: cfg.editorsPicks.enabled ? (
      <EditorsPicks title={cfg.editorsPicks.title} description={cfg.editorsPicks.description} max={cfg.editorsPicks.max} />
    ) : null,
    destinations: cfg.destinations.enabled ? (
      <Destinations title={cfg.destinations.title} description={cfg.destinations.description} slugs={cfg.destinations.slugs} />
    ) : null,
    latest: cfg.latest.enabled ? (
      <Latest title={cfg.latest.title} count={cfg.latest.count} categorySlug={cfg.latest.categorySlug} />
    ) : null,
    stays: cfg.stays.enabled ? (
      <StaysBand cfg={cfg.stays} />
    ) : null,
    experiences: cfg.experiences.enabled ? (
      <ExperiencesBand cfg={cfg.experiences} />
    ) : null,
    instagram:
      cfg.instagram.enabled && cfg.instagram.images.length > 0 ? (
        <InstagramBand cfg={cfg.instagram} />
      ) : null,
    newsletter: cfg.newsletter.enabled ? (
      <Newsletter title={cfg.newsletter.title} description={cfg.newsletter.description} />
    ) : null,
  };

  return (
    <div className="bg-background">
      {campaign && <CampaignBanner campaign={campaign} />}
      {cfg.order.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
    </div>
  );
}

/* ─────────────────────────────── Hero ─────────────────────────────── */
function Hero({ cfg }: { cfg: ReturnType<typeof getHomepage>["hero"] }) {
  return (
    <section className="relative isolate overflow-hidden bg-forest-deep">
      {cfg.image && (
        <Image
          src={cfg.image.src}
          alt={cfg.image.alt}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="container-page relative flex min-h-[520px] flex-col justify-center py-20 sm:min-h-[600px]">
        <p className="mb-4 flex items-center gap-2 text-sm uppercase tracking-[0.22em] text-white/85">
          The Earthy Journal <Leaf className="h-4 w-4" />
        </p>
        <h1 className="max-w-2xl whitespace-pre-line font-serif text-5xl leading-[1.05] text-white sm:text-6xl lg:text-7xl">
          {cfg.title}
        </h1>
        <p className="mt-6 max-w-md text-lg leading-relaxed text-white/90">
          {cfg.subtitle}
        </p>
        <div>
          <Link
            href={cfg.ctaHref}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-forest px-7 py-3.5 text-sm font-medium text-white transition-transform hover:scale-[1.02]"
          >
            {cfg.ctaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────── Category nav ─────────────────────────── */
function CategoryNav() {
  const categories = getEnabledCategories();
  if (!categories.length) return null;
  return (
    <section className="border-b border-border/60">
      <div className="container-page py-8">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Explore by category
        </p>
        <div className="flex snap-x gap-8 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:justify-center sm:gap-10">
          {categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.slug] ?? Leaf;
            return (
              <Link
                key={c.slug}
                href={`/journal/category/${c.slug}`}
                className="group flex shrink-0 snap-start flex-col items-center gap-2 text-center"
              >
                <Icon className="h-6 w-6 text-forest transition-transform group-hover:-translate-y-0.5" strokeWidth={1.5} />
                <span className="whitespace-nowrap text-sm text-muted-foreground transition-colors group-hover:text-foreground">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Editor's Picks ────────────────────────── */
function EditorsPicks({ title, description, max }: { title: string; description?: string; max: number }) {
  const picks = getEditorsPicks(max);
  if (!picks.length) return null;
  return (
    <section className="container-page py-14">
      <SectionHead title={title} description={description} href="/journal/search" hrefLabel="View All Picks" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}

/* ─────────────────────────── Destinations ─────────────────────────── */
function Destinations({ title, description, slugs }: { title: string; description?: string; slugs: string[] }) {
  const all = getEnabledJournalDestinations();
  const list = slugs.length
    ? slugs.map((s) => all.find((d) => d.slug === s)).filter(Boolean)
    : all;
  const dests = list.filter(Boolean) as typeof all;
  if (!dests.length) return null;
  return (
    <section className="container-page py-14">
      <SectionHead title={title} description={description} />
      <div className="mt-8 flex snap-x gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {dests.map((d) => (
          <Link
            key={d.slug}
            href={`/journal/destination/${d.slug}`}
            className="group relative aspect-[3/4] w-44 shrink-0 snap-start overflow-hidden rounded-xl sm:w-52"
          >
            {d.image ? (
              <Image src={d.image.src} alt={d.image.alt} fill sizes="208px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="h-full w-full bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-3 left-4 font-title text-lg font-semibold text-white">
              {d.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ────────────────────────── Latest Stories ─────────────────────────── */
function Latest({ title, count, categorySlug }: { title: string; count: number; categorySlug?: string }) {
  const articles = getLatestArticles({ count, categorySlug });
  if (!articles.length) return null;
  return (
    <section className="container-page py-14">
      <SectionHead title={title} href="/journal/search" hrefLabel="View All Stories" />
      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} />
        ))}
      </div>
    </section>
  );
}

/* ──────────────────────── Stays conversion band ────────────────────── */
function StaysBand({ cfg }: { cfg: ReturnType<typeof getHomepage>["stays"] }) {
  const villas = (cfg.slugs.length
    ? cfg.slugs.map((s) => getVillaBySlug(s)).filter(Boolean)
    : getFeaturedVillas()
  ).slice(0, 1);
  const villa = villas[0];
  const img = villa?.images?.[0];
  return (
    <section className="container-page py-6">
      <Link
        href={cfg.ctaHref}
        className="group relative flex min-h-[280px] items-end overflow-hidden rounded-3xl"
      >
        {img && (
          <Image src={img.src} alt={img.alt || cfg.title} fill sizes="100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
        <div className="relative p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Stay somewhere special</p>
          <h2 className="mt-2 max-w-md font-serif text-3xl text-white sm:text-4xl">{cfg.title}</h2>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-forest">
            Explore Stays <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </section>
  );
}

/* ──────────────────── Experiences conversion band ──────────────────── */
function ExperiencesBand({ cfg }: { cfg: ReturnType<typeof getHomepage>["experiences"] }) {
  const exps = (cfg.slugs.length
    ? cfg.slugs.map((s) => getExperienceBySlug(s)).filter(Boolean)
    : getPublishedExperiences()
  ).slice(0, 1);
  const exp = exps[0];
  return (
    <section className="container-page py-6">
      <Link
        href={cfg.ctaHref}
        className="group relative flex min-h-[280px] items-end overflow-hidden rounded-3xl"
      >
        {exp?.image?.src && (
          <Image src={exp.image.src} alt={exp.image.alt || cfg.title} fill sizes="100vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
        <div className="relative p-8 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-white/80">Do more than stay</p>
          <h2 className="mt-2 max-w-md font-serif text-3xl text-white sm:text-4xl">{cfg.title}</h2>
          <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-forest">
            Explore Experiences <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>
    </section>
  );
}

/* ───────────────────────────── Instagram ───────────────────────────── */
function InstagramBand({ cfg }: { cfg: ReturnType<typeof getHomepage>["instagram"] }) {
  return (
    <section className="container-page py-14">
      <div className="rounded-3xl bg-beige/50 p-8 sm:p-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Follow our journey</p>
            <p className="mt-1 font-serif text-2xl text-foreground">{cfg.handle}</p>
          </div>
          <a
            href={cfg.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-forest hover:text-forest-deep"
          >
            <InstagramGlyph className="h-4 w-4" /> Follow on Instagram
          </a>
        </div>
        {cfg.images.length > 0 && (
          <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-6">
            {cfg.images.slice(0, 6).map((img, i) => (
              <a key={i} href={cfg.url} target="_blank" rel="noopener noreferrer" className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={img.src} alt={img.alt} fill sizes="150px" className="object-cover" />
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ───────────────────────────── Newsletter ──────────────────────────── */
function Newsletter({ title, description }: { title: string; description?: string }) {
  return (
    <section className="border-t border-border/60 bg-beige/40">
      <div className="container-page grid gap-8 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Get stories & travel inspiration</p>
          <h2 className="mt-2 font-serif text-4xl text-foreground">{title}</h2>
          {description && <p className="mt-3 max-w-md text-muted-foreground">{description}</p>}
        </div>
        <div className="md:justify-self-end">
          <NewsletterForm source="journal-home" />
          <p className="mt-3 text-xs text-muted-foreground">No spam. Just places worth discovering.</p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Section header ────────────────────────── */
function SectionHead({
  title,
  description,
  href,
  hrefLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="font-serif text-2xl text-foreground sm:text-3xl">{title}</h2>
        {description && <p className="mt-1.5 text-muted-foreground">{description}</p>}
      </div>
      {href && hrefLabel && (
        <Link href={href} className="hidden shrink-0 items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-deep sm:inline-flex">
          {hrefLabel} <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
