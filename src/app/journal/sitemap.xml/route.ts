import { getPublishedArticles } from "@/lib/data/journal";
import { getEnabledCategories } from "@/lib/data/journal-categories";
import { getEnabledJournalDestinations } from "@/lib/data/journal-destinations";

export const dynamic = "force-dynamic";

const SITE = "https://earthystays.com";

function url(loc: string, lastmod: string, priority: number, freq = "weekly") {
  return `  <url><loc>${loc}</loc><lastmod>${lastmod}</lastmod><changefreq>${freq}</changefreq><priority>${priority}</priority></url>`;
}

/** Segmented Journal sitemap (spec §33) — just the Journal surface, so search
 *  engines can crawl and re-index articles independently of the main sitemap. */
export function GET() {
  const now = new Date().toISOString();
  const rows: string[] = [url(`${SITE}/journal`, now, 0.8, "daily")];

  for (const c of getEnabledCategories())
    rows.push(url(`${SITE}/journal/category/${c.slug}`, now, 0.6));
  for (const d of getEnabledJournalDestinations())
    rows.push(url(`${SITE}/journal/destination/${d.slug}`, now, 0.6));
  for (const a of getPublishedArticles())
    rows.push(
      url(`${SITE}/journal/${a.slug}`, a.updatedAt || now, 0.7),
    );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${rows.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
