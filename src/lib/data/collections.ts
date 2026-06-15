import type { Collection } from "@/lib/types";
import { readJsonSync } from "@/lib/storage";

const SEED: Collection[] = [
  {
    slug: "pool-villas",
    name: "Pool Villas",
    blurb: "Private infinity pools and turquoise plunges.",
    image: {
      src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80",
      alt: "Villa with private pool",
    },
  },
  {
    slug: "pet-friendly",
    name: "Pet Friendly",
    blurb: "Bring the whole family — four legs included.",
    image: {
      src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1600&q=80",
      alt: "Dog on the porch of a country villa",
    },
  },
  {
    slug: "beachfront",
    name: "Beachfront",
    blurb: "Step from the door, sand between your toes.",
    image: {
      src: "https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=1600&q=80",
      alt: "Beachfront villa",
    },
  },
  {
    slug: "weekend-escapes",
    name: "Weekend Escapes",
    blurb: "Under two hours from a major city.",
    image: {
      src: "https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=1600&q=80",
      alt: "Countryside villa with a long lawn",
    },
  },
  {
    slug: "for-large-groups",
    name: "For Large Groups",
    blurb: "Sleeps 12+, made for milestones.",
    image: {
      src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80",
      alt: "Sprawling group villa",
    },
  },
];

/** Admin-managed collection data — overrides cover photo + name/blurb, plus
 *  can add new collections or hide seed ones. */
type AdminCollections = {
  overrides?: Record<
    string,
    { name?: string; blurb?: string; image?: { src: string; alt: string } }
  >;
  added?: Collection[];
  deleted?: string[];
};

function loadAdminCollections(): AdminCollections {
  return readJsonSync<AdminCollections>("admin-collections.json", {});
}

/** All collections (seed + admin-added, minus deleted, with overrides). */
export const collections: Collection[] = SEED;

export function getAllCollections(): Collection[] {
  const admin = loadAdminCollections();
  const deleted = new Set(admin.deleted ?? []);
  const out: Collection[] = [];

  for (const c of SEED) {
    if (deleted.has(c.slug)) continue;
    const ov = admin.overrides?.[c.slug];
    out.push({
      slug: c.slug,
      name: ov?.name ?? c.name,
      blurb: ov?.blurb ?? c.blurb,
      image: ov?.image ?? c.image,
    });
  }
  for (const c of admin.added ?? []) {
    if (deleted.has(c.slug)) continue;
    if (SEED.some((s) => s.slug === c.slug)) continue;
    out.push(c);
  }
  return out;
}

export function getCollectionBySlug(slug: string) {
  return getAllCollections().find((c) => c.slug === slug);
}

export function isSeedCollection(slug: string): boolean {
  return SEED.some((c) => c.slug === slug);
}
