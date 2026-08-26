import Link from "next/link";
import {
  FileText,
  Eye,
  Building2,
  Compass,
  Plus,
} from "lucide-react";
import { getAllArticles } from "@/lib/data/journal";
import { getEnabledCategories } from "@/lib/data/journal-categories";

export const dynamic = "force-dynamic";
export const metadata = { title: "Journal · Admin" };

export default function JournalDashboard() {
  const all = getAllArticles();
  const published = all.filter((a) => a.status === "published");
  const sum = (k: "views" | "propertyClicks" | "experienceClicks" | "shares") =>
    all.reduce((t, a) => t + (a[k] ?? 0), 0);

  const byStatus = (s: string) => all.filter((a) => a.status === s).length;
  const mostViewed = [...all].sort((a, b) => (b.views ?? 0) - (a.views ?? 0))[0];

  const topArticles = [...published]
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 8);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl">The Earthy Journal</h1>
          <p className="mt-1 text-muted-foreground">
            {all.length} articles · {getEnabledCategories().length} categories · {published.length} live
          </p>
        </div>
        <Link href="/admin/journal/articles/new" className="inline-flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-medium text-white hover:bg-forest-deep">
          <Plus className="h-4 w-4" /> New article
        </Link>
      </div>

      {/* Content status */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total articles" value={all.length} icon={FileText} />
        <StatCard label="Published" value={byStatus("published")} />
        <StatCard label="Drafts" value={byStatus("draft")} />
        <StatCard label="Scheduled" value={byStatus("scheduled")} />
        <StatCard label="Archived" value={byStatus("archived")} />
      </div>

      {/* Performance */}
      <h2 className="mb-3 font-display text-2xl">Performance</h2>
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total views" value={sum("views")} icon={Eye} />
        <StatCard label="Property clicks" value={sum("propertyClicks")} icon={Building2} />
        <StatCard label="Experience clicks" value={sum("experienceClicks")} icon={Compass} />
        <StatCard label="Shares" value={sum("shares")} />
      </div>

      {mostViewed && (
        <p className="mb-8 text-sm text-muted-foreground">
          Most-viewed story:{" "}
          <Link href={`/admin/journal/articles/${mostViewed.id}`} className="font-medium text-forest hover:underline">
            {mostViewed.title}
          </Link>{" "}
          · {(mostViewed.views ?? 0).toLocaleString("en-IN")} views
        </p>
      )}

      {/* Attribution table (spec §37) */}
      <div className="flex items-center justify-between">
        <h2 className="mb-3 font-display text-2xl">Top articles &amp; attribution</h2>
        <Link href="/admin/journal/analytics" className="text-sm text-forest hover:underline">
          Full analytics →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Article</th>
              <th className="px-4 py-3 font-medium">Views</th>
              <th className="px-4 py-3 font-medium">Property clicks</th>
              <th className="px-4 py-3 font-medium">Exp. clicks</th>
              <th className="px-4 py-3 font-medium">Shares</th>
            </tr>
          </thead>
          <tbody>
            {topArticles.map((a) => (
              <tr key={a.id} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3">
                  <Link href={`/admin/journal/articles/${a.id}`} className="font-medium hover:text-forest">
                    {a.title}
                  </Link>
                </td>
                <td className="admin-numeric px-4 py-3">{(a.views ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3">{(a.propertyClicks ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3">{(a.experienceClicks ?? 0).toLocaleString("en-IN")}</td>
                <td className="admin-numeric px-4 py-3">{(a.shares ?? 0).toLocaleString("en-IN")}</td>
              </tr>
            ))}
            {topArticles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">
                  No published articles yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon?: typeof FileText;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground/60" />}
      </div>
      <p className="admin-numeric mt-2 text-2xl font-semibold text-foreground">
        {value.toLocaleString("en-IN")}
      </p>
    </div>
  );
}
