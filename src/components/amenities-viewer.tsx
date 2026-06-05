"use client";

import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PREVIEW = 8;

export function AmenitiesViewer({
  items,
}: {
  items: { name: string; icon: ReactNode }[];
}) {
  const preview = items.slice(0, PREVIEW);
  const hasMore = items.length > PREVIEW;

  return (
    <div>
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

          <DialogContent className="!max-w-2xl max-h-[85vh] overflow-y-auto p-6 sm:!max-w-2xl">
            <DialogTitle className="font-display text-2xl font-bold tracking-tight text-foreground">
              All amenities
            </DialogTitle>
            <ul className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {items.map((it) => (
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
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
