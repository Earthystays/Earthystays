"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal } from "lucide-react";
import type { ListingStatus } from "@/lib/types";
import {
  deleteListing,
  duplicateListing,
  toggleListingVisibility,
} from "@/app/host/(dash)/listings/actions";

export function ListingRowActions({
  slug,
  status,
}: {
  slug: string;
  status?: ListingStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setOpen(false);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) alert(res.error ?? "Something went wrong");
      router.refresh();
    });
  }

  const canToggle = status === "approved" || status === "hidden";

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Listing actions"
        onClick={() => setOpen((o) => !o)}
        disabled={pending}
        className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-50"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-xl border border-border bg-background py-1 shadow-lg">
            <Link
              href={`/host/listings/${slug}/edit`}
              className="block px-4 py-2 text-sm hover:bg-muted/50"
              onClick={() => setOpen(false)}
            >
              Edit
            </Link>
            {status === "approved" && (
              <Link
                href={`/villas/${slug}`}
                target="_blank"
                className="block px-4 py-2 text-sm hover:bg-muted/50"
                onClick={() => setOpen(false)}
              >
                View live page
              </Link>
            )}
            {canToggle && (
              <button
                type="button"
                onClick={() => run(() => toggleListingVisibility(slug))}
                className="block w-full px-4 py-2 text-left text-sm hover:bg-muted/50"
              >
                {status === "approved" ? "Hide from site" : "Unhide"}
              </button>
            )}
            <button
              type="button"
              onClick={() => run(() => duplicateListing(slug))}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-muted/50"
            >
              Duplicate
            </button>
            <button
              type="button"
              onClick={() => {
                if (confirm("Delete this listing? This can't be undone.")) {
                  run(() => deleteListing(slug));
                }
              }}
              className="block w-full px-4 py-2 text-left text-sm text-destructive hover:bg-destructive/5"
            >
              Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
