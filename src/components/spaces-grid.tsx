import Image from "next/image";
import Link from "next/link";
import type { Image as VillaImage } from "@/lib/types";
import { categorizePhoto } from "@/lib/photo-categories";

type Space = {
  tag: string;
  cover: VillaImage;
  count: number;
};

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
    // overflow-hidden on the outer wrapper is defensive: it prevents the
    // slider's wide content from ever pushing the parent column wider than
    // the viewport, which previously caused the page to render at a tiny
    // mobile scale.
    <div className="min-w-0 overflow-hidden">
      <h3 className="font-display text-xl font-bold tracking-tight text-foreground">
        Explore the spaces
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Tap any space to see more photos.
      </p>
      <div className="mt-5 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {spaces.map((space) => (
          <Link
            key={space.tag}
            href={`/villas/${slug}/photos?tag=${encodeURIComponent(space.tag)}`}
            className="group relative aspect-[4/3] w-[68vw] max-w-[280px] shrink-0 snap-start overflow-hidden rounded-xl bg-muted sm:w-[42vw] sm:max-w-none lg:w-[calc((100%-1.5rem)/3)]"
          >
            <Image
              src={space.cover.src}
              alt={space.cover.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 42vw, 68vw"
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
