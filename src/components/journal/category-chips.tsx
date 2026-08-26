import Link from "next/link";
import type { JournalCategory } from "@/lib/journal/types";

/** Horizontal, scroll-on-mobile row of category pills used on the category
 *  and search pages. */
export function CategoryChips({
  categories,
  activeSlug,
}: {
  categories: JournalCategory[];
  activeSlug?: string;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Link
        href="/journal/search"
        className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
          !activeSlug
            ? "border-forest bg-forest text-white"
            : "border-border text-muted-foreground hover:border-forest hover:text-forest"
        }`}
      >
        All
      </Link>
      {categories.map((c) => (
        <Link
          key={c.slug}
          href={`/journal/category/${c.slug}`}
          className={`shrink-0 rounded-full border px-4 py-1.5 text-sm transition-colors ${
            activeSlug === c.slug
              ? "border-forest bg-forest text-white"
              : "border-border text-muted-foreground hover:border-forest hover:text-forest"
          }`}
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
