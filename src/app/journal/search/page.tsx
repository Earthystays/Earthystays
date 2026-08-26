import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { searchArticles, type ArticleSort } from "@/lib/data/journal";
import { getEnabledCategories } from "@/lib/data/journal-categories";
import { ArticleCard } from "@/components/journal/article-card";
import { CategoryChips } from "@/components/journal/category-chips";
import { SearchBox, SortSelect } from "@/components/journal/search-box";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search — The Earthy Journal",
  description: "Search travel stories, guides and destinations across the Earthy Journal.",
  robots: { index: false, follow: true },
};

const PAGE_SIZE = 12;

type SP = Promise<{ q?: string; category?: string; tag?: string; sort?: string; page?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const sort = (sp.sort as ArticleSort) ?? "newest";
  const page = Math.max(1, Number(sp.page) || 1);

  const results = searchArticles({
    q,
    categorySlug: sp.category,
    tag: sp.tag,
    sort,
  });

  const total = results.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const clamped = Math.min(page, pages);
  const slice = results.slice((clamped - 1) * PAGE_SIZE, clamped * PAGE_SIZE);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.category) params.set("category", sp.category);
    if (sp.tag) params.set("tag", sp.tag);
    if (sort !== "newest") params.set("sort", sort);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/journal/search${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="container-page py-10">
      <header className="max-w-2xl">
        <h1 className="font-serif text-4xl text-foreground sm:text-5xl">The Journal</h1>
        <p className="mt-2 text-muted-foreground">
          Search stories, guides and destinations worth discovering.
        </p>
      </header>

      <div className="mt-6 max-w-2xl">
        <Suspense fallback={<div className="h-14 rounded-full bg-muted" />}>
          <SearchBox />
        </Suspense>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="max-w-full flex-1">
          <CategoryChips categories={getEnabledCategories()} activeSlug={sp.category} />
        </div>
        <Suspense fallback={null}>
          <SortSelect />
        </Suspense>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        {total} {total === 1 ? "story" : "stories"}
        {q && (
          <>
            {" "}for <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>
          </>
        )}
        {sp.tag && (
          <>
            {" "}tagged <span className="font-medium text-foreground">#{sp.tag}</span>
          </>
        )}
      </p>

      {slice.length ? (
        <>
          <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {slice.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>

          {pages > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
              {clamped > 1 && (
                <Link href={pageHref(clamped - 1)} className="rounded-full border border-border px-4 py-2 text-sm hover:border-forest hover:text-forest">
                  Previous
                </Link>
              )}
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={pageHref(p)}
                  aria-current={p === clamped ? "page" : undefined}
                  className={`grid h-10 w-10 place-items-center rounded-full text-sm ${
                    p === clamped ? "bg-forest text-white" : "border border-border hover:border-forest hover:text-forest"
                  }`}
                >
                  {p}
                </Link>
              ))}
              {clamped < pages && (
                <Link href={pageHref(clamped + 1)} className="rounded-full border border-border px-4 py-2 text-sm hover:border-forest hover:text-forest">
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <div className="my-24 text-center">
          <p className="font-serif text-2xl text-foreground">
            We couldn&apos;t find a story matching your search.
          </p>
          <p className="mt-2 text-muted-foreground">
            Try a different keyword, or{" "}
            <Link href="/journal" className="text-forest underline">
              browse the Journal
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
