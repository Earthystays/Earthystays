import Link from "next/link";
import { Plus } from "lucide-react";
import { getVillas } from "@/lib/data/villas";
import { buttonVariants } from "@/components/ui/button";
import { VillasTable } from "./villas-table";
import { ImportListingButton } from "./import-modal";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function AdminVillasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const villas = getVillas();
  const sp = await searchParams;
  const added = sp.added;
  const deleted = sp.deleted;

  return (
    <div>
      <header className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-4xl">Villas</h1>
          <p className="mt-2 text-muted-foreground">
            {villas.length} {villas.length === 1 ? "property" : "properties"} in your collection.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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

      <VillasTable villas={villas} />

      <p className="mt-4 text-xs text-muted-foreground">
        Seed properties (bundled in <code className="rounded bg-muted px-1 py-0.5">src/lib/data/villas.ts</code>) can be edited but reappear if you delete them. Properties you add or override go to <code className="rounded bg-muted px-1 py-0.5">data/villas.json</code>.
      </p>
    </div>
  );
}
