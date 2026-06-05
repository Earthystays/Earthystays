"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import type { Villa } from "@/lib/types";
import { categorizePhoto } from "@/lib/photo-categories";
import { ShareButton } from "@/components/share-button";

const ALL = "All" as const;

export function PhotoViewer({ villa }: { villa: Villa }) {
  const sp = useSearchParams();
  const urlTag = sp.get("tag");
  const [filter, setFilter] = useState<string>(urlTag || ALL);

  // If URL tag changes (e.g., navigating between space tiles), follow it.
  // The URL is the external source of truth — local state lets the user
  // change filters without bouncing the URL on every click.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local UI state with URL search params
    setFilter(urlTag || ALL);
  }, [urlTag]);

  // For each image, the display label = explicit tag if present, else auto-category.
  const enriched = villa.images.map((img, i) => ({
    ...img,
    idx: i + 1,
    displayTag: (img.tag && img.tag.trim()) || categorizePhoto(img.alt),
  }));

  // Build the filter list in insertion order so admin tag order is preserved
  const seen = new Set<string>();
  const order: string[] = [];
  for (const e of enriched) {
    if (!seen.has(e.displayTag)) {
      seen.add(e.displayTag);
      order.push(e.displayTag);
    }
  }

  const visible = filter === ALL ? enriched : enriched.filter((e) => e.displayTag === filter);

  async function share() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${villa.name} — Earthy Stays`;
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // fall through
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }
  // share() helper kept for keyboard fallback; primary share uses <ShareButton>.
  void share;

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <Link
            href={`/villas/${villa.slug}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-terracotta"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="truncate max-w-[70vw]">{villa.name}</span>
          </Link>
          <ShareButton title={villa.name} description={villa.tagline} />
        </div>

        {/* Tag filter pills */}
        <div className="container-page flex gap-2 overflow-x-auto pb-3 whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterPill
            label="All"
            count={enriched.length}
            active={filter === ALL}
            onClick={() => setFilter(ALL)}
          />
          {order.map((tag) => (
            <FilterPill
              key={tag}
              label={tag}
              count={enriched.filter((e) => e.displayTag === tag).length}
              active={filter === tag}
              onClick={() => setFilter(tag)}
            />
          ))}
        </div>
      </header>

      {/* Photo grid */}
      <main className="container-page py-6 lg:py-8">
        {visible.length === 0 ? (
          <p className="py-20 text-center text-sm text-muted-foreground">
            No photos in this category yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:gap-4">
            {visible.map((img, i) => (
              <figure
                key={img.src + i}
                className="relative overflow-hidden rounded-xl bg-muted"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="(min-width: 1024px) 600px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                    priority={i < 2}
                  />
                  {/* Tag overlay (bottom-left) */}
                  <span className="absolute bottom-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                    {img.displayTag}
                  </span>
                  {/* Index counter (top-right) */}
                  <div className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-0.5 text-[11px] font-medium text-white backdrop-blur-sm">
                    {img.idx} / {enriched.length}
                  </div>
                </div>
              </figure>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function FilterPill({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border bg-card text-foreground hover:bg-muted"
      }`}
    >
      {label}
      <span
        className={`ml-1.5 text-xs ${
          active ? "text-primary-foreground/75" : "text-muted-foreground"
        }`}
      >
        {count}
      </span>
    </button>
  );
}
