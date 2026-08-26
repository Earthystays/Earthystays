import Image from "next/image";
import Link from "next/link";
import { BookOpen, MapPin, Sparkles } from "lucide-react";
import type { Experience } from "@/lib/types";
import type { JournalArticle } from "@/lib/journal/types";
import { experienceHref } from "@/lib/data/experiences";

/**
 * Turns a collection page from a filtered list into a merchandising page:
 * where this collection's stays actually are, what to do there, and what to
 * read first.
 *
 * Each block is independent and only renders when it has real content, so a
 * small collection quietly shows less rather than showing empty shelves.
 */
export function CollectionConnections({
  destinations,
  experiences,
  articles,
  collectionName,
}: {
  destinations: { slug: string; name: string; count: number }[];
  experiences: Experience[];
  articles: JournalArticle[];
  collectionName: string;
}) {
  const hasAnything =
    destinations.length > 0 || experiences.length > 0 || articles.length > 0;
  if (!hasAnything) return null;

  return (
    <div className="mt-16 grid gap-12">
      {destinations.length > 0 && (
        <section aria-labelledby="collection-destinations-heading">
          <h2
            id="collection-destinations-heading"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground"
          >
            <MapPin className="h-5 w-5 text-terracotta" aria-hidden="true" />
            Where to find {collectionName.toLowerCase()}
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2.5">
            {destinations.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/locations/${d.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-foreground transition-colors hover:border-terracotta/50"
                >
                  {d.name}
                  <span className="font-numeric text-xs tabular-nums text-muted-foreground">
                    {d.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {experiences.length > 0 && (
        <section aria-labelledby="collection-experiences-heading">
          <h2
            id="collection-experiences-heading"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground"
          >
            <Sparkles className="h-5 w-5 text-terracotta" aria-hidden="true" />
            Things to do nearby
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {experiences.map((e) => (
              <li key={e.slug}>
                <Link
                  href={experienceHref(e)}
                  className="group flex h-full flex-col overflow-hidden rounded-xl border border-border/60 bg-card transition-colors hover:border-terracotta/40"
                >
                  {e.image?.src && (
                    <div className="relative aspect-[16/10]">
                      <Image
                        src={e.image.src}
                        alt={e.image.alt || e.name}
                        fill
                        sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-medium leading-snug text-foreground">
                      {e.name}
                    </h3>
                    {e.city && (
                      <p className="mt-1 text-xs text-muted-foreground">{e.city}</p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {articles.length > 0 && (
        <section aria-labelledby="collection-journal-heading">
          <h2
            id="collection-journal-heading"
            className="inline-flex items-center gap-2 font-display text-2xl font-bold tracking-tight text-foreground"
          >
            <BookOpen className="h-5 w-5 text-terracotta" aria-hidden="true" />
            Read before you go
          </h2>
          <ul className="mt-5 grid gap-3">
            {articles.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/journal/${a.slug}`}
                  className="group flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-colors hover:border-terracotta/40"
                >
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-medium text-foreground group-hover:text-terracotta">
                      {a.title}
                    </h3>
                    {a.excerpt && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {a.excerpt}
                      </p>
                    )}
                  </div>
                  {typeof a.readingTime === "number" && a.readingTime > 0 && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {a.readingTime} min
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
