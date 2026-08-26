import Link from "next/link";
import { getAllArticles } from "@/lib/data/journal";
import { getAllCategories } from "@/lib/data/journal-categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Analytics · Journal" };

export default function JournalAnalyticsPage() {
  const articles = getAllArticles().filter((a) => a.status === "published");
  const categories = getAllCategories();
  const catName = (s: string) => categories.find((c) => c.slug === s)?.name ?? s;

  const totals = articles.reduce(
    (t, a) => ({
      views: t.views + (a.views ?? 0),
      prop: t.prop + (a.propertyClicks ?? 0),
      exp: t.exp + (a.experienceClicks ?? 0),
      shares: t.shares + (a.shares ?? 0),
    }),
    { views: 0, prop: 0, exp: 0, shares: 0 },
  );

  const ctr = (clicks: number, views: number) =>
    views > 0 ? `${((clicks / views) * 100).toFixed(1)}%` : "—";

  const ranked = [...articles].sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

  // Views by category (simple bar).
  const byCategory = categories
    .map((c) => ({
      name: c.name,
      views: articles.filter((a) => a.categorySlug === c.slug).reduce((t, a) => t + (a.views ?? 0), 0),
    }))
    .filter((c) => c.views > 0)
    .sort((a, b) => b.views - a.views);
  const maxCat = Math.max(1, ...byCategory.map((c) => c.views));

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Analytics</h1>
        <p className="mt-2 text-muted-foreground">
          How the Journal drives discovery and bookings. Property &amp; experience
          clicks are attributed to the article they came from (spec §37).
        </p>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Views" value={totals.views} />
        <Stat label="Property clicks" value={totals.prop} sub={ctr(totals.prop, totals.views)} />
        <Stat label="Experience clicks" value={totals.exp} sub={ctr(totals.exp, totals.views)} />
        <Stat label="Shares" value={totals.shares} />
      </div>

      {byCategory.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-display text-2xl">Views by category</h2>
          <div className="space-y-2 rounded-xl border border-border bg-card p-5">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-muted-foreground">{c.name}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-forest" style={{ width: `${(c.views / maxCat) * 100}%` }} />
                </div>
                <span className="admin-numeric w-16 shrink-0 text-right text-sm">{c.views.toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-3 font-display text-2xl">Per-article attribution</h2>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Prop. clicks</th>
              <th className="px-4 py-3 font-medium">Prop. CTR</th>
              <th className="px-4 py-3 font-medium">Exp. clicks</th>
              <th className="px-4 py-3 font-medium">Shares</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((a) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0">
                <td className="max-w-xs px-4 py-3">
                  <Link href={`/admin/journal/articles/${a.id}`} className="font-medium hover:text-forest">{a.title}</Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{catName(a.categorySlug)}</td>
                <td className="admin-numeric px-4 py-3">{(a.views ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3">{(a.propertyClicks ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3 text-muted-foreground">{ctr(a.propertyClicks ?? 0, a.views ?? 0)}</td>
                <td className="admin-numeric px-4 py-3">{(a.experienceClicks ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3">{(a.shares ?? 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {ranked.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">No published articles yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="admin-numeric mt-1.5 text-2xl font-semibold">{value.toLocaleString("en-IN")}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub} of views</p>}
    </div>
  );
}
