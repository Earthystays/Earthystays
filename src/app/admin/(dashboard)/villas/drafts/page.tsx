import Link from "next/link";
import { Pencil, FileText } from "lucide-react";
import { getAllDrafts, deriveDraftLabel } from "@/lib/data/villa-drafts";
import { DiscardDraftButton } from "./discard-button";

export const metadata = { title: "Drafts · Admin" };
export const dynamic = "force-dynamic";

export default async function DraftsPage() {
  const drafts = await getAllDrafts();

  return (
    <div>
      <header>
        <Link
          href="/admin/villas"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← Back to villas
        </Link>
        <h1 className="mt-3 font-display text-4xl">Drafts</h1>
        <p className="mt-2 text-muted-foreground">
          Half-finished villas saved automatically while you were editing. Open
          one to keep going — nothing here is live on the site until you
          publish it.
        </p>
      </header>

      {drafts.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
          <p className="mt-3 font-medium">No drafts saved</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start a new villa at{" "}
            <Link href="/admin/villas/new" className="text-terracotta hover:underline">
              /admin/villas/new
            </Link>{" "}
            and it&apos;ll show up here while you fill it in.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-3">
          {drafts.map((d) => {
            const label = deriveDraftLabel(d.values);
            const slug = (d.values.slug ?? "").trim();
            const city = (d.values.city ?? "").trim();
            const state = (d.values.state ?? "").trim();
            const loc = [city, state].filter(Boolean).join(", ");
            return (
              <li
                key={d.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {slug && <span>/{slug} · </span>}
                    {loc && <span>{loc} · </span>}
                    Last edited {new Date(d.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/admin/villas/drafts/${d.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Continue
                  </Link>
                  <DiscardDraftButton draftId={d.id} label={label} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
