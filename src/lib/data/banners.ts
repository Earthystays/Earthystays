import { readJsonSync } from "@/lib/storage";
import type { HeroSlide } from "@/components/hero-slider";

const SEED: HeroSlide[] = [
  {
    image: {
      src: "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=2400&q=80",
      alt: "Infinity pool villa at sunset",
    },
    eyebrow: "Now booking",
    title: "Newly Launched Villas",
    chip: "Up to 25% off introductory rates*",
    href: "/villas?sort=featured",
  },
  {
    image: {
      src: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=2400&q=80",
      alt: "Coastal villa under a coconut grove",
    },
    eyebrow: "On the coast",
    title: "Goa, slowed down.",
    chip: "Explore beach villas",
    href: "/locations/goa",
  },
  {
    image: {
      src: "https://images.unsplash.com/photo-1518302057166-c990a3585cc3?auto=format&fit=crop&w=2400&q=80",
      alt: "Hillside villa over a misty valley",
    },
    eyebrow: "Monsoon-ready",
    title: "Hill homes for the rains.",
    chip: "View Lonavala stays",
    href: "/locations/lonavala",
  },
  {
    image: {
      src: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2400&q=80",
      alt: "Restored heritage haveli in Udaipur",
    },
    eyebrow: "Heritage",
    title: "Royalty for a long weekend.",
    chip: "Haveli stays in Udaipur",
    href: "/locations/udaipur",
  },
];

/**
 * Returns the current hero slides. Reads data/banners.json if present,
 * falls back to the SEED defined here. The admin editor overwrites
 * data/banners.json with the full slide array.
 */
export function getBanners(): HeroSlide[] {
  const saved = readJsonSync<HeroSlide[] | null>("banners.json", null);
  if (saved && Array.isArray(saved) && saved.length > 0) return saved;
  return SEED;
}

export function getSeedBanners(): HeroSlide[] {
  return SEED;
}
