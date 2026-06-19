import type { Experience } from "@/lib/types";
import { readJsonSync } from "@/lib/storage";

const SEED: Experience[] = [
  {
    slug: "yacht-charters",
    name: "Yacht Charters",
    blurb:
      "Private sunset cruises, celebrations, and luxury experiences at sea.",
    image: {
      src: "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?auto=format&fit=crop&w=1200&q=80",
      alt: "Couple on a private yacht at sunset",
    },
  },
  {
    slug: "private-chef",
    name: "Private Chef",
    blurb:
      "Curated dining experiences prepared in the comfort of your villa.",
    image: {
      src: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?auto=format&fit=crop&w=1200&q=80",
      alt: "Private chef plating a meal in a villa kitchen",
    },
  },
  {
    slug: "celebrations-and-decor",
    name: "Celebrations & Decor",
    blurb:
      "Birthday setups, anniversaries, proposals, and special occasions.",
    image: {
      src: "https://images.unsplash.com/photo-1530023367847-a683933f4172?auto=format&fit=crop&w=1200&q=80",
      alt: "Romantic candlelit celebration setup",
    },
  },
  {
    slug: "airport-transfers",
    name: "Airport Transfers",
    blurb: "Comfortable and reliable transfers to and from your stay.",
    image: {
      src: "https://images.unsplash.com/photo-1485395037613-e83d5c1f5290?auto=format&fit=crop&w=1200&q=80",
      alt: "Luxury car waiting at airport pickup",
    },
  },
  {
    slug: "adventure-activities",
    name: "Adventure Activities",
    blurb:
      "Scuba diving, parasailing, watersports, and island adventures.",
    image: {
      src: "https://images.unsplash.com/photo-1530989241526-2c2c50d6cabd?auto=format&fit=crop&w=1200&q=80",
      alt: "Scuba diver exploring a reef",
    },
  },
  {
    slug: "car-and-scooter-rentals",
    name: "Car & Scooter Rentals",
    blurb: "Explore Goa at your own pace.",
    image: {
      src: "https://images.unsplash.com/photo-1502786129293-79981df4e689?auto=format&fit=crop&w=1200&q=80",
      alt: "Vintage scooter parked by a Goan road",
    },
  },
  {
    slug: "corporate-retreats",
    name: "Corporate Retreats",
    blurb: "Curated offsites and team getaways.",
    image: {
      src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80",
      alt: "Team in a relaxed outdoor strategy session",
    },
  },
  {
    slug: "custom-experiences",
    name: "Custom Experiences",
    blurb: "Tailored recommendations based on guest preferences.",
    image: {
      src: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80",
      alt: "Concierge planning a bespoke itinerary",
    },
  },
];

type AdminExperiences = {
  overrides?: Record<
    string,
    { name?: string; blurb?: string; image?: { src: string; alt: string } }
  >;
  added?: Experience[];
  deleted?: string[];
};

function loadAdminExperiences(): AdminExperiences {
  return readJsonSync<AdminExperiences>("admin-experiences.json", {});
}

export const experiences: Experience[] = SEED;

export function getAllExperiences(): Experience[] {
  const admin = loadAdminExperiences();
  const deleted = new Set(admin.deleted ?? []);
  const out: Experience[] = [];

  for (const e of SEED) {
    if (deleted.has(e.slug)) continue;
    const ov = admin.overrides?.[e.slug];
    out.push({
      slug: e.slug,
      name: ov?.name ?? e.name,
      blurb: ov?.blurb ?? e.blurb,
      image: ov?.image ?? e.image,
    });
  }
  for (const e of admin.added ?? []) {
    if (deleted.has(e.slug)) continue;
    if (SEED.some((s) => s.slug === e.slug)) continue;
    out.push(e);
  }
  return out;
}

export function getExperienceBySlug(slug: string) {
  return getAllExperiences().find((e) => e.slug === slug);
}

export function isSeedExperience(slug: string): boolean {
  return SEED.some((e) => e.slug === slug);
}
