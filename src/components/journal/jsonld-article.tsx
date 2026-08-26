import type { JournalArticle } from "@/lib/journal/types";
import { getAuthorById } from "@/lib/data/journal-authors";

const SITE = "https://earthystays.com";

export function ArticleJsonLd({ article }: { article: JournalArticle }) {
  const author = article.authorId ? getAuthorById(article.authorId) : undefined;
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: article.heroImage ? [article.heroImage.src] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt || article.publishedAt,
    author: {
      "@type": author && author.id !== "earthy-editors" ? "Person" : "Organization",
      name: author?.name ?? "Earthy Stays",
    },
    publisher: {
      "@type": "Organization",
      name: "Earthy Stays",
      logo: { "@type": "ImageObject", url: `${SITE}/brand/logo.png` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE}/journal/${article.slug}`,
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
