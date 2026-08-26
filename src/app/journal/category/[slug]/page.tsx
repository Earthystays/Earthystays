import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getEnabledCategories } from "@/lib/data/journal-categories";
import { getArticlesByCategory } from "@/lib/data/journal";
import { ArticleCard } from "@/components/journal/article-card";
import { Breadcrumbs, type Crumb } from "@/components/breadcrumbs";
import { BreadcrumbJsonLd } from "@/components/jsonld-breadcrumb";
import { CategoryChips } from "@/components/journal/category-chips";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const cat = getCategoryBySlug(slug);
  if (!cat) return { title: "Category not found" };
  const seo = cat.seo ?? {};
  return {
    title: seo.title || `${cat.name} — The Earthy Journal`,
    description: seo.description || cat.description,
    alternates: { canonical: `/journal/category/${cat.slug}` },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category || !category.enabled) notFound();

  const articles = getArticlesByCategory(category.slug);
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Journal", href: "/journal" },
    { label: category.name, href: `/journal/category/${category.slug}` },
  ];

  return (
    <div className="bg-background">
      <BreadcrumbJsonLd items={crumbs} />
      <div className="container-page pt-8">
        <Breadcrumbs items={crumbs} />
        <header className="mt-6 max-w-2xl">
          <h1 className="font-serif text-4xl text-foreground sm:text-5xl">{category.name}</h1>
          {category.description && (
            <p className="mt-3 text-lg text-muted-foreground">{category.description}</p>
          )}
        </header>

        <div className="mt-8">
          <CategoryChips categories={getEnabledCategories()} activeSlug={category.slug} />
        </div>

        {articles.length ? (
          <div className="mt-10 grid gap-8 pb-16 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        ) : (
          <div className="my-24 text-center">
            <p className="font-serif text-2xl text-foreground">We&apos;re still writing this story.</p>
            <p className="mt-2 text-muted-foreground">Check back soon for new pieces in {category.name}.</p>
          </div>
        )}
      </div>
    </div>
  );
}
