import Image from "next/image";
import Link from "next/link";
import type { Image as VillaImage } from "@/lib/types";
import { categorizePhoto } from "@/lib/photo-categories";
import { ScrollSlider } from "@/components/scroll-slider";

type Space = {
  tag: string;
  cover: VillaImage;
  count: number;
};

/**
 * Group photos by tag (or auto-category) and pick the first photo
 * of each group as the cover. Used to render the "Explore the spaces"
 * slider on the villa detail page.
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
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
        Explore the spaces
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Tap any space to see more photos.
      </p>
      <ScrollSlider className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {spaces.map((space) => (
          <Link
            key={space.tag}
            href={`/villas/${slug}/photos?tag=${encodeURIComponent(space.tag)}`}
            className="group relative aspect-[5/4] w-[58vw] shrink-0 snap-start overflow-hidden rounded-xl bg-muted sm:w-[38vw] lg:w-[calc((100%-1.5rem)/3)]"
          >
            <Image
              src={space.cover.src}
              alt={space.cover.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 38vw, 58vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-3 sm:p-4">
              <p className="font-display text-base font-semibold text-white sm:text-lg">
                {space.tag}
              </p>
              {space.count > 1 && (
                <p className="mt-0.5 text-[11px] text-white/80 sm:text-xs">
                  {space.count} photo{space.count === 1 ? "" : "s"}
                </p>
              )}
            </div>
          </Link>
        ))}
      </ScrollSlider>
    </div>
  );
}
