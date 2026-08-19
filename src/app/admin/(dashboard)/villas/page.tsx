import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { getVillasWithHidden } from "@/lib/data/villas";
import { getUsers } from "@/lib/data/users";
import { buttonVariants } from "@/components/ui/button";
import { VillasTable, type HostInfo } from "./villas-table";
import { ImportListingButton } from "./import-modal";
import { getAllDrafts } from "@/lib/data/villa-drafts";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminVillasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const villas = getVillasWithHidden();
  const drafts = await getAllDrafts();
  // userId → host details for the Host column (only ids actually assigned).
  const assignedIds = new Set(villas.map((v) => v.hostId).filter(Boolean));
  const hostsById: Record<string, HostInfo> = {};
  for (const u of await getUsers()) {
    if (assignedIds.has(u.id)) hostsById[u.id] = { name: u.name, email: u.email };
  }
  const sp = await searchParams;
  const added = sp.added;
  const deleted = sp.deleted;

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="admin-page-title">Villas</h1>
          <p className="admin-subtitle mt-3">
            <span className="admin-numeric font-semibold text-[#23211C]">{villas.length}</span>{" "}
            {villas.length === 1 ? "property" : "properties"} in your collection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/villas/drafts"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <FileText className="h-4 w-4" />
            Drafts
            {drafts.length > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-[11px] font-semibold text-white">
                {drafts.length}
              </span>
            )}
          </Link>
          <ImportListingButton />
          <Link
            href="/admin/villas/new"
            className={buttonVariants({ className: "rounded-full" })}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add a property
          </Link>
        </div>
      </header>

      {(added || deleted) && (
        <div className="mt-6 rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          {added && (
            <p>
              ✓ Saved <span className="font-medium">{added}</span>.{" "}
              <Link href={`/villas/${added}`} target="_blank" className="text-terracotta hover:underline">
                View on site →
              </Link>
            </p>
          )}
          {deleted && (
            <p>
              ✓ Deleted <span className="font-medium">{deleted}</span>.
            </p>
          )}
        </div>
      )}

      <VillasTable villas={villas} hostsById={hostsById} />

      <p className="mt-4 text-xs text-muted-foreground">
        Deletions stick — bundled seed villas you delete are recorded in <code className="rounded bg-muted px-1 py-0.5">data/deleted-villas.json</code> so they don&apos;t reappear. Properties you add go to <code className="rounded bg-muted px-1 py-0.5">data/villas.json</code>.
      </p>
    </div>
  );
}
