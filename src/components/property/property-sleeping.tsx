import Image from "next/image";
import { BedDouble } from "lucide-react";
import type { Image as VillaImage } from "@/lib/types";

/**
 * Sleeping arrangement for whole-property listings (villas & apartments).
 *
 * IMPORTANT: the villa data model carries only `bedrooms: number` — there is no
 * per-bedroom bed type, ensuite flag, or AC field. So this renders exactly what
 * exists: the bedroom count, plus a card per bedroom that has a tagged photo
 * (e.g. an image tagged "Bedroom 2"). Bed configurations are never guessed.
 *
 * Hotels and hostels do not use this — their `units[]` carry a real
 * `bedConfiguration` and render through HotelRooms / DormsSection instead.
 */

/** Pulls the first photo tagged for each numbered bedroom, in order. */
function bedroomPhotos(images: VillaImage[]): Array<{
  label: string;
  image: VillaImage;
  order: number;
}> {
  const found = new Map<string, { label: string; image: VillaImage; order: number }>();

  for (const img of images) {
    const tag = img.tag?.trim();
    if (!tag) continue;
    const match = /^bedroom\s*(\d+)?$/i.exec(tag);
    if (!match) continue;
    const key = tag.toLowerCase();
    if (found.has(key)) continue; // first photo per bedroom wins
    found.set(key, {
      label: tag,
      image: img,
      order: match[1] ? Number(match[1]) : 0,
    });
  }

  return [...found.values()].sort((a, b) => a.order - b.order);
}

export function PropertySleeping({
  bedrooms,
  bathrooms,
  images,
}: {
  bedrooms: number;
  bathrooms: number;
  images: VillaImage[];
}) {
  if (bedrooms <= 0) return null;

  const photos = bedroomPhotos(images);

  return (
    <div className="grid gap-5">
      <p className="text-sm text-muted-foreground">
        {bedrooms} {bedrooms === 1 ? "bedroom" : "bedrooms"}
        {bathrooms > 0 && (
          <>
            {" · "}
            {bathrooms} {bathrooms === 1 ? "bathroom" : "bathrooms"}
          </>
        )}
      </p>

      {photos.length > 0 ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map(({ label, image }) => (
              <li
                key={label}
                className="overflow-hidden rounded-xl border border-border/60 bg-card"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={image.src}
                    alt={image.alt || label}
                    fill
                    sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 px-4 py-3">
                  <BedDouble
                    className="h-4 w-4 text-terracotta"
                    strokeWidth={1.5}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {label}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* Be explicit when photos cover only some of the bedrooms, rather
              than letting the count and the card total silently disagree. */}
          {photos.length < bedrooms && (
            <p className="text-xs text-muted-foreground">
              Photographed bedrooms shown. Ask us for a full layout of all{" "}
              {bedrooms} bedrooms when you inquire.
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Bedroom-by-bedroom details aren&apos;t listed for this property yet —
          ask us about the layout and bed configuration when you inquire.
        </p>
      )}
    </div>
  );
}
