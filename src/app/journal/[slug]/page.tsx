import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import type { HeadingBlock } from "@/lib/journal/types";
import {
  getPublishedArticleBySlug,
  getArticleByPreviousSlug,
  getRelatedArticles,
  getPublishedArticles,
} from "@/lib/data/journal";
import { getCategoryBySlug } from "@/lib/data/journal-categories";
import { getAuthorById } from "@/lib/data/journal-authors";
import { getJournalDestinationBySlug } from "@/lib/data/journal-destinations";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/jsonld-breadcrumb";
import { ArticleJsonLd } from "@/components/journal/jsonld-article";
import { BlockRenderer, headingId } from "@/components/journal/block-renderer";
import { ArticleCard, formatJournalDate } from "@/components/journal/article-card";
import { ReadingProgress } from "@/components/journal/reading-progress";
import { TableOfContents, type TocItem } from "@/components/journal/table-of-contents";
import { ShareButtons } from "@/components/journal/share-buttons";
import { ArticleTracker } from "@/components/journal/article-tracker";
import { NewsletterForm } from "@/components/journal/newsletter-form";

export const dynamic = "force-dynamic";

const SITE = "https://earthystays.com";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return { title: "Story not found" };

  const seo = article.seo ?? {};
  const title = seo.title || article.title;
  const description = seo.description || article.excerpt;
  const ogImage = seo.ogImage || article.heroImage?.src;

  return {
    title,
    description,
    alternates: { canonical: seo.canonicalUrl || `/journal/${article.slug}` },
    robots: seo.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: ogImage ? [ogImage] : undefined,
      publishedTime: article.publishedAt,
      modifiedTime: article.updatedAt,
    },
    twitter: {
      card: "summary_large_image",
      title: seo.ogTitle || title,
      description: seo.ogDescription || description,
      images: seo.twitterImage || ogImage ? [seo.twitterImage || ogImage!] : undefined,
    },
  };
}

export function generateStaticParams() {
  return getPublishedArticles().map((a) => ({ slug: a.slug }));
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  let article = getPublishedArticleBySlug(slug);
  if (!article) {
    // Old slug? 301 to the canonical URL so links never break (spec §35).
    const byOld = getArticleByPreviousSlug(slug);
    if (byOld) permanentRedirect(`/journal/${byOld.slug}`);
    notFound();
  }

  const category = getCategoryBySlug(article.categorySlug);
  const author = article.authorId ? getAuthorById(article.authorId) : undefined;
  const destination = article.destinationSlug
    ? getJournalDestinationBySlug(article.destinationSlug)
    : undefined;
  const related = getRelatedArticles(article, 3);

  const toc: TocItem[] = article.blocks
    .filter((b): b is HeadingBlock => b.type === "heading")
    .map((b) => ({ id: headingId(b), text: b.text, level: b.level }));

  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Journal", href: "/journal" },
    ...(category
      ? [{ label: category.name, href: `/journal/category/${category.slug}` }]
      : []),
    { label: article.title, href: `/journal/${article.slug}` },
  ];

  return (
    <article className="bg-background">
      <ReadingProgress />
      <ArticleTracker slug={article.slug} />
      <ArticleJsonLd article={article} />
      <BreadcrumbJsonLd items={crumbs} />

      {/* Header */}
      <header className="container-page max-w-3xl pt-8">
        <Breadcrumbs items={crumbs.slice(0, -1)} />
        {category && (
          <Link
            href={`/journal/category/${category.slug}`}
            className="mt-6 inline-block text-xs font-semibold uppercase tracking-[0.18em] text-forest"
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-3 font-serif text-4xl leading-[1.1] text-foreground sm:text-5xl">
          {article.title}
        </h1>
        {article.subtitle && (
          <p className="mt-4 text-xl leading-relaxed text-muted-foreground">
            {article.subtitle}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {author && (
              <span className="font-medium text-foreground">{author.name}</span>
            )}
            {article.publishedAt && <span>·</span>}
            {article.publishedAt && <span>{formatJournalDate(article.publishedAt)}</span>}
            {article.readingTime && <span>·</span>}
            {article.readingTime && <span>{article.readingTime} min read</span>}
          </div>
          <ShareButtons url={`${SITE}/journal/${article.slug}`} title={article.title} />
        </div>
      </header>

      {/* Hero image */}
      {article.heroImage && (
        <figure className="container-page mt-8 max-w-5xl">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl">
            {article.mobileHeroImage && (
              <Image
                src={article.mobileHeroImage.src}
                alt={article.mobileHeroImage.alt || article.heroImage.alt}
                fill
                priority
                sizes="100vw"
                className="object-cover sm:hidden"
              />
            )}
            <Image
              src={article.heroImage.src}
              alt={article.heroImage.alt}
              fill
              priority
              sizes="100vw"
              className={`object-cover ${article.mobileHeroImage ? "hidden sm:block" : ""}`}
            />
          </div>
          {(article.heroCaption || article.heroCredit) && (
            <figcaption className="mt-2.5 text-center text-sm text-muted-foreground">
              {article.heroCaption}
              {article.heroCredit && (
                <span className="text-muted-foreground/70"> · {article.heroCredit}</span>
              )}
            </figcaption>
          )}
        </figure>
      )}

      {/* Body + TOC */}
      <div className="container-page mt-12 grid max-w-6xl gap-12 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <TableOfContents items={toc} />
        </aside>
        <div className="mx-auto w-full max-w-2xl">
          <BlockRenderer blocks={article.blocks} />

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-2 border-t border-border/60 pt-6">
              {article.tags.map((t) => (
                <Link
                  key={t}
                  href={`/journal/search?tag=${encodeURIComponent(t)}`}
                  className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:border-forest hover:text-forest"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {/* Author card */}
          {author && (
            <div className="mt-8 flex items-center gap-4 rounded-2xl bg-beige/40 p-5">
              {author.avatar ? (
                <div className="relative h-12 w-12 overflow-hidden rounded-full">
                  <Image src={author.avatar.src} alt={author.name} fill sizes="48px" className="object-cover" />
                </div>
              ) : (
                <div className="grid h-12 w-12 place-items-center rounded-full bg-forest/15 font-serif text-lg text-forest">
                  {author.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-medium text-foreground">{author.name}</p>
                {author.role && <p className="text-sm text-muted-foreground">{author.role}</p>}
              </div>
            </div>
          )}

          {destination && (
            <Link
              href={`/journal/destination/${destination.slug}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-forest hover:text-forest-deep"
            >
              More stories from {destination.name} →
            </Link>
          )}
        </div>
      </div>

      {/* Newsletter */}
      <section className="mt-16 border-t border-border/60 bg-beige/40">
        <div className="container-page grid max-w-4xl gap-6 py-12 text-center">
          <h2 className="font-serif text-3xl text-foreground">Travel more. Worry less.</h2>
          <p className="mx-auto max-w-md text-muted-foreground">
            Get our best travel stories and guides straight to your inbox.
          </p>
          <div className="mx-auto">
            <NewsletterForm source="journal-article" />
          </div>
        </div>
      </section>

      {/* Keep exploring */}
      {related.length > 0 && (
        <section className="container-page py-16">
          <h2 className="font-serif text-2xl text-foreground sm:text-3xl">Keep exploring</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
