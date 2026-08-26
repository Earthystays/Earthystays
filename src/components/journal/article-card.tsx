import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { JournalArticle } from "@/lib/journal/types";
import { articleHref } from "@/lib/data/journal";
import { getCategoryBySlug } from "@/lib/data/journal-categories";

export function formatJournalDate(iso?: string): string {
  if (!iso) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

type Variant = "default" | "compact" | "feature";

export function ArticleCard({
  article,
  variant = "default",
  showExcerpt = true,
}: {
  article: JournalArticle;
  variant?: Variant;
  showExcerpt?: boolean;
}) {
  const category = getCategoryBySlug(article.categorySlug);
  const img = article.heroImage;

  const aspect =
    variant === "feature" ? "aspect-[16/10]" : variant === "compact" ? "aspect-[16/11]" : "aspect-[4/3]";

  return (
    <Link href={articleHref(article)} className="group flex flex-col">
      <div className={`relative ${aspect} overflow-hidden rounded-xl`}>
        {img ? (
          <Image
            src={img.src}
            alt={img.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        {category && (
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {category.name}
          </span>
        )}
        <h3
          className={`mt-2 font-serif leading-snug text-foreground transition-colors group-hover:text-forest ${
            variant === "feature" ? "text-2xl" : variant === "compact" ? "text-base" : "text-lg"
          }`}
        >
          {article.title}
        </h3>

        {showExcerpt && variant !== "compact" && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-3 text-xs text-muted-foreground">
          {article.readingTime && <span>{article.readingTime} min read</span>}
          {article.readingTime && variant !== "compact" && <span>·</span>}
          {variant !== "compact" && (
            <span className="inline-flex items-center gap-1 font-medium text-foreground transition-all group-hover:gap-1.5">
              Read more <ArrowRight className="h-3.5 w-3.5" />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
