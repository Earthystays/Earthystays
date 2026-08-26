import Link from "next/link";
import { Plus } from "lucide-react";
import type { JournalStatus } from "@/lib/journal/types";
import { getAllArticles } from "@/lib/data/journal";
import { getAllCategories } from "@/lib/data/journal-categories";
import { ArticleRowActions } from "./row-actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Articles · Journal" };

const STATUS_STYLE: Record<JournalStatus, string> = {
  published: "bg-forest/10 text-forest",
  draft: "bg-muted text-muted-foreground",
  in_review: "bg-amber-100 text-amber-700",
  scheduled: "bg-blue-100 text-blue-700",
  archived: "bg-stone/20 text-muted-foreground",
};

type SP = Promise<{ status?: string; category?: string; q?: string }>;

export default async function AdminArticlesPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const categories = getAllCategories();
  let articles = getAllArticles();

  if (sp.status) articles = articles.filter((a) => a.status === sp.status);
  if (sp.category) articles = articles.filter((a) => a.categorySlug === sp.category);
  if (sp.q) {
    const n = sp.q.toLowerCase();
    articles = articles.filter((a) => a.title.toLowerCase().includes(n));
  }
  articles = articles.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

  const counts = getAllArticles().reduce<Record<string, number>>((acc, a) => {
    acc[a.status] = (acc[a.status] ?? 0) + 1;
    acc.all = (acc.all ?? 0) + 1;
    return acc;
  }, {});

  const filters: Array<{ key: string; label: string }> = [
    { key: "", label: `All (${counts.all ?? 0})` },
    { key: "published", label: `Published (${counts.published ?? 0})` },
    { key: "draft", label: `Draft (${counts.draft ?? 0})` },
    { key: "scheduled", label: `Scheduled (${counts.scheduled ?? 0})` },
    { key: "in_review", label: `In review (${counts.in_review ?? 0})` },
    { key: "archived", label: `Archived (${counts.archived ?? 0})` },
  ];

  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-4xl">Articles</h1>
        <Link href="/admin/journal/articles/new" className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep">
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => {
          const active = (sp.status ?? "") === f.key;
          const href = f.key ? `/admin/journal/articles?status=${f.key}` : "/admin/journal/articles";
          return (
            <Link
              key={f.key || "all"}
              href={href}
              className={`rounded-full px-3.5 py-1.5 text-sm ${active ? "bg-forest text-white" : "border border-border text-muted-foreground hover:text-foreground"}`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Prop. clicks</th>
              <th className="px-4 py-3 font-medium">Updated</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {articles.map((a) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0">
                <td className="max-w-xs px-4 py-3">
                  <Link href={`/admin/journal/articles/${a.id}`} className="font-medium text-foreground hover:text-forest">
                    {a.title || "Untitled"}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">/journal/{a.slug}</p>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{catName(a.categorySlug)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[a.status]}`}>
                    {a.status.replace("_", " ")}
                  </span>
                </td>
                <td className="admin-numeric px-4 py-3 text-muted-foreground">{(a.views ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3 text-muted-foreground">{(a.propertyClicks ?? 0).toLocaleString("en-IN")}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {a.updatedAt ? new Date(a.updatedAt).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <ArticleRowActions id={a.id} slug={a.slug} status={a.status} />
                </td>
              </tr>
            ))}
            {articles.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  No articles yet. <Link href="/admin/journal/articles/new" className="text-forest hover:underline">Write your first story</Link>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
