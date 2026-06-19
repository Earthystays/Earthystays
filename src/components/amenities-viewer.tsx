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
  const preview = items.slice(0, PREVIEW);
  const hasMore = items.length > PREVIEW;
  const grouped = groupAmenitiesByCategory(items);

  return (
    <div>
      {/* Inline preview — flat top-8 grid, unchanged behaviour. */}
      <ul className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-4">
        {preview.map((it) => (
          <li
            key={it.name}
            className="flex items-center gap-3 text-sm text-foreground"
          >
            <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-card">
              {it.icon}
            </span>
            <span className="leading-snug">{it.name}</span>
          </li>
        ))}
      </ul>

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
