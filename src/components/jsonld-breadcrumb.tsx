import type { Crumb } from "@/components/breadcrumbs";

const SITE = "https://earthystays.com";

/**
 * BreadcrumbList JSON-LD matching the visible <Breadcrumbs> trail on the
 * page. Pass the same `items` array used for the visible breadcrumb —
 * including a real `href` on the last (current-page) entry, not "#", so
 * every step resolves to an absolute URL Google can verify against the
 * page it's crawling.
 */
export function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items
      .filter((item) => item.href && item.href !== "#")
      .map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.label,
        item: item.href!.startsWith("http") ? item.href : `${SITE}${item.href}`,
      })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
