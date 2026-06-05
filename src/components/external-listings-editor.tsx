"use client";

import { useState } from "react";
import { Info, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export type ExternalListing = {
  platform: string;
  url: string;
  rating?: number;
  reviewCount?: number;
};

const PRESETS = ["Airbnb", "Booking.com", "Google", "Vrbo", "TripAdvisor", "Agoda", "Expedia"];

const PLATFORM_TIPS: Record<string, string> = {
  Airbnb:
    "On the listing page, look at the top — e.g. 4.92 ★ (89 reviews). Enter 4.92 and 89.",
  "Booking.com":
    "Convert their 10-point score to 5: divide by 2 (e.g. 9.4 → 4.7). Review count sits next to the score.",
  Google:
    "Search the villa name in Google → the right-side panel shows 4.8 (142). Use those numbers.",
  Vrbo: "Rating + count sit just under the listing title.",
  TripAdvisor:
    "Use the bubble rating (1–5). Review count is shown directly below.",
  Agoda: "Convert their /10 score to /5 (divide by 2).",
  Expedia: "Convert their /10 score to /5 (divide by 2).",
};

export function ExternalListingsEditor({
  name,
  initial = [],
}: {
  name: string;
  initial?: ExternalListing[];
}) {
  const [items, setItems] = useState<ExternalListing[]>(initial);

  function add() {
    setItems((s) => [...s, { platform: "Airbnb", url: "", rating: undefined, reviewCount: undefined }]);
  }
  function remove(i: number) {
    setItems((s) => s.filter((_, idx) => idx !== i));
  }
  function patch<K extends keyof ExternalListing>(i: number, key: K, value: ExternalListing[K]) {
    setItems((s) => s.map((it, idx) => (idx === i ? { ...it, [key]: value } : it)));
  }

  // Only serialize entries with a URL (the bare minimum)
  const valid = items.filter((it) => it.platform && it.url);

  return (
    <div className="grid gap-4">
      <input type="hidden" name={name} value={JSON.stringify(valid)} />

      {/* Permanent help banner — the same advice applies whether there are 0 or 10 entries */}
      <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="space-y-1.5 leading-relaxed">
          <p>
            <strong>Ratings are entered manually, not fetched.</strong> Airbnb, Booking,
            Google, Vrbo etc. all block automated review scraping, so you need to look up the
            current rating + review count on each listing and type them below.
          </p>
          <p>
            If you leave the rating and review count blank, the card on the public page will
            just say <em>&ldquo;View listing →&rdquo;</em> with no number. To show the star rating
            and total, fill in both fields.
          </p>
          <p className="opacity-80">
            Update these numbers every few months so they stay accurate.
          </p>
        </div>
      </div>

      {items.length === 0 && (
        <p className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
          Cross-list this villa on Airbnb, Booking.com, Google, Vrbo, TripAdvisor, etc.? Add the URLs
          here and the detail page will show their ratings + a link out so guests can read those reviews.
        </p>
      )}

      <ul className="grid gap-3">
        {items.map((it, i) => (
          <li key={i} className="grid gap-3 rounded-lg border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                Listing {i + 1}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="inline-flex items-center gap-1 text-xs text-destructive hover:underline"
              >
                <Trash2 className="h-3 w-3" /> Remove
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Platform
                </span>
                <input
                  list={`platform-${i}`}
                  value={it.platform}
                  onChange={(e) => patch(i, "platform", e.target.value)}
                  placeholder="Airbnb"
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                />
                <datalist id={`platform-${i}`}>
                  {PRESETS.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">URL</span>
                <Input
                  value={it.url}
                  onChange={(e) => patch(i, "url", e.target.value)}
                  placeholder="https://www.airbnb.com/rooms/123456"
                />
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Rating (0–5)
                </span>
                <Input
                  type="number"
                  step="0.1"
                  min={0}
                  max={5}
                  value={it.rating ?? ""}
                  onChange={(e) =>
                    patch(i, "rating", e.target.value === "" ? undefined : Number(e.target.value))
                  }
                  placeholder="4.9"
                />
              </label>
              <label className="grid gap-1">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Review count
                </span>
                <Input
                  type="number"
                  min={0}
                  value={it.reviewCount ?? ""}
                  onChange={(e) =>
                    patch(
                      i,
                      "reviewCount",
                      e.target.value === "" ? undefined : Number(e.target.value),
                    )
                  }
                  placeholder="142"
                />
              </label>
            </div>

            {PLATFORM_TIPS[it.platform] && (
              <p className="rounded-md bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                <span className="font-medium text-foreground">
                  Where to find it on {it.platform}:
                </span>{" "}
                {PLATFORM_TIPS[it.platform]}
              </p>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={add}
        className="inline-flex w-fit items-center gap-1.5 rounded-full border border-border bg-card px-4 py-1.5 text-sm hover:bg-muted"
      >
        <Plus className="h-3.5 w-3.5" />
        {items.length === 0 ? "Add external listing" : "Add another"}
      </button>
    </div>
  );
}
