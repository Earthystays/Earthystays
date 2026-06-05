import type { Collection } from "@/lib/types";

export const collections: Collection[] = [
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

export function getCollectionBySlug(slug: string) {
  return collections.find((c) => c.slug === slug);
}
