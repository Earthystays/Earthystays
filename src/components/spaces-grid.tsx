import Image from "next/image";
import Link from "next/link";
import type { Image as VillaImage } from "@/lib/types";
import { categorizePhoto } from "@/lib/photo-categories";

type Space = {
  tag: string;
  cover: VillaImage;
  count: number;
};

/**
 * Group photos by tag (or auto-category) and pick the first photo
 * of each group as the cover. Used to render the "Explore the spaces"
 * tile grid on the villa detail page.
 */
function buildSpaces(images: VillaImage[]): Space[] {
  const map = new Map<string, Space>();
  for (const img of images) {
    const tag = (img.tag && img.tag.trim()) || categorizePhoto(img.alt);
    if (!map.has(tag)) {
      map.set(tag, { tag, cover: img, count: 1 });
    } else {
      const s = map.get(tag)!;
      s.count += 1;
    }
  }
  return Array.from(map.values());
}

export function SpacesGrid({
  images,
  slug,
}: {
  images: VillaImage[];
  slug: string;
}) {
  const spaces = buildSpaces(images);
  if (spaces.length === 0) return null;

  return (
    <div>
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">Explore the spaces</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Tap any space to see more photos.
      </p>
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {spaces.map((space) => (
          <Link
            key={space.tag}
            href={`/villas/${slug}/photos?tag=${encodeURIComponent(space.tag)}`}
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            <Image
              src={space.cover.src}
              alt={space.cover.alt}
              fill
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3">
              <p className="text-sm font-semibold text-white">{space.tag}</p>
              {space.count > 1 && (
                <p className="text-[11px] text-white/80">
                  {space.count} photo{space.count === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
