"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { groupAmenitiesByCategory } from "@/lib/amenity-categories";

const PREVIEW = 8;

type Item = { name: string; icon: ReactNode };

export function AmenitiesViewer({ items }: { items: Item[] }) {
  const hasMore = items.length > PREVIEW;
  const grouped = groupAmenitiesByCategory(items);

  /* Inline preview, grouped rather than flat: take whole categories in
     priority order until we have roughly PREVIEW amenities, so the preview
     reads as "Pool & wellness: a, b · Outdoor: c, d" instead of an
     unexplained top-8. Always shows at least the first category. */
  const previewGroups: typeof grouped = [];
  let shown = 0;
  for (const group of grouped) {
    if (previewGroups.length > 0 && shown >= PREVIEW) break;
    previewGroups.push(group);
    shown += group.items.length;
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        {previewGroups.map(({ category, items: catItems }) => (
          <section key={category}>
            <h3 className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {category}
            </h3>
            <ul className="mt-3 grid gap-x-6 gap-y-4 sm:grid-cols-2">
              {catItems.map((it) => (
                <li
                  key={it.name}
                  className="flex items-center gap-3 text-sm text-foreground"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
                    {it.icon}
                  </span>
                  <span className="leading-snug">{it.name}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {hasMore && (
        <Dialog>
          <DialogTrigger
            render={
              <button
                type="button"
                className="mt-6 inline-flex items-center justify-center rounded-md border border-foreground/80 bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
              />
            }
          >
            View all {items.length} amenities
          </DialogTrigger>

          <DialogContent className="!max-w-2xl max-h-[85vh] overflow-y-auto p-7 sm:!max-w-2xl">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
              What this place offers
            </DialogTitle>
            <div className="mt-6 space-y-8">
              {grouped.map(({ category, items: catItems }) => (
                <section key={category}>
                  <h3 className="text-base font-semibold text-foreground">
                    {category}
                  </h3>
                  <ul className="mt-3 divide-y divide-border/60">
                    {catItems.map((it) => (
                      <li
                        key={it.name}
                        className="flex items-center gap-4 py-3 text-sm text-foreground"
                      >
                        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-foreground/75">
                          {it.icon}
                        </span>
                        <span className="leading-snug">{it.name}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
