import type { Villa } from "@/lib/types";
import { readJsonSync } from "@/lib/storage";
import { getViewScoresSync } from "./villa-views";

const SEED: Villa[] = [
  {
    slug: "casa-azul-anjuna",
    name: "Casa Azul",
    tagline: "Blue-shuttered Portuguese villa, two minutes from the cove.",
    description:
      "A restored 1920s home in the lanes above Anjuna beach. Casa Azul keeps the original mosaic floors and rosewood doors, paired with a long lap pool, a shaded veranda for long lunches, and a kitchen built around a wood-fired oven. Sleep four couples, host twenty for dinner.",
    destinationSlug: "goa",
    state: "Goa",
    city: "North Goa",
    collections: ["pool-villas", "pet-friendly", "beachfront"],
    bedrooms: 4,
    maxGuests: 9,
    bathrooms: 4,
    pricePerNight: 38000,
    rating: 4.9,
    reviewCount: 142,
    amenities: [
      "Private Pool",
      "Sea View",
      "Pet Friendly",
      "Chef on Call",
      "Wi-Fi",
      "Air Conditioning",
      "Garden",
    ],
    highlights: [
      "2-minute walk to Anjuna beach",
      "Restored 1920s Portuguese architecture",
      "In-house chef available on request",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1600&q=80", alt: "Casa Azul facade with blue shutters" },
      { src: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1600&q=80", alt: "Pool at Casa Azul" },
      { src: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80", alt: "Living room with mosaic floors" },
      { src: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80", alt: "Bedroom with rosewood doors" },
    ],
    houseRules: [
      "Check-in 2pm, check-out 11am",
      "No loud music after 10pm",
      "Pets welcome with prior notice",
    ],
    locationNote: "Anjuna, North Goa — 45 min from Dabolim airport.",
    featured: true,
  },
  {
    slug: "the-banyan-house-lonavala",
    name: "The Banyan House",
    tagline: "Sahyadri valley views, infinity pool, full glass walls.",
    description:
      "Built around a 200-year-old banyan, this contemporary hill home opens entirely onto the valley. Six suites, an infinity pool that disappears into the horizon, a chef's kitchen, and a fire-warmed living room for the monsoon weeks.",
    destinationSlug: "maharashtra",
    state: "Maharashtra",
    city: "Lonavala",
    collections: ["pool-villas", "weekend-escapes", "for-large-groups"],
    bedrooms: 6,
    maxGuests: 14,
    bathrooms: 6,
    pricePerNight: 52000,
    rating: 4.8,
    reviewCount: 98,
    amenities: [
      "Private Pool",
      "Mountain View",
      "Fireplace",
      "Chef on Call",
      "Wi-Fi",
      "Air Conditioning",
      "Garden",
      "Bonfire",
    ],
    highlights: [
      "Infinity pool overlooking the valley",
      "Sleeps 14 across 6 suites",
      "90 minutes from Mumbai",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1518302057166-c990a3585cc3?auto=format&fit=crop&w=1600&q=80", alt: "Hillside villa exterior" },
      { src: "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1600&q=80", alt: "Infinity pool with valley view" },
      { src: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80", alt: "Living room with valley view" },
      { src: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=80", alt: "Suite at the Banyan House" },
    ],
    houseRules: [
      "Check-in 2pm, check-out 11am",
      "Smoking outdoors only",
      "Bonfire setup on request",
    ],
    locationNote: "Tungarli, Lonavala — 90 min from Mumbai.",
    featured: true,
  },
  {
    slug: "haveli-mor-udaipur",
    name: "Haveli Mor",
    tagline: "Restored 18th-century haveli with a peacock courtyard.",
    description:
      "Behind a heavy carved door in Udaipur's old city, Haveli Mor opens into a courtyard of frescoes and fountains. Five suites with original jharokhas, a rooftop dinner deck with City Palace views, and a curated library of Mewar history.",
    destinationSlug: "rajasthan",
    state: "Rajasthan",
    city: "Udaipur",
    collections: ["pool-villas"],
    bedrooms: 5,
    maxGuests: 10,
    bathrooms: 5,
    pricePerNight: 65000,
    rating: 4.95,
    reviewCount: 76,
    amenities: [
      "Private Pool",
      "Chef on Call",
      "Wi-Fi",
      "Air Conditioning",
      "Garden",
      "Spa",
    ],
    highlights: [
      "Restored heritage haveli",
      "Rooftop dining with City Palace view",
      "In-house spa therapist on call",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1600&q=80", alt: "Haveli courtyard" },
      { src: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1600&q=80", alt: "Suite with jharokha window" },
      { src: "https://images.unsplash.com/photo-1551776235-dde6d482980b?auto=format&fit=crop&w=1600&q=80", alt: "Rooftop dinner deck" },
      { src: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?auto=format&fit=crop&w=1600&q=80", alt: "Frescoed wall detail" },
    ],
    houseRules: [
      "Check-in 3pm, check-out 11am",
      "No outside catering without notice",
      "Children welcome",
    ],
    locationNote: "Lal Ghat, Udaipur — walking distance to City Palace.",
    featured: true,
  },
  {
    slug: "the-arabica-coorg",
    name: "The Arabica",
    tagline: "Coffee-estate villa with private walking trails.",
    description:
      "A working coffee estate that opens three suites to guests. Wake to plantation walks, lunch at the estate's open kitchen, take a sunset jeep ride into the pepper vines. The Arabica is for travellers who want the land to set the pace.",
    destinationSlug: "karnataka",
    state: "Karnataka",
    city: "Coorg",
    collections: ["pet-friendly", "weekend-escapes"],
    bedrooms: 3,
    maxGuests: 6,
    bathrooms: 3,
    pricePerNight: 28000,
    rating: 4.85,
    reviewCount: 64,
    amenities: [
      "Mountain View",
      "Pet Friendly",
      "Fireplace",
      "Wi-Fi",
      "Garden",
      "Bonfire",
    ],
    highlights: [
      "Working coffee estate",
      "Guided plantation walks included",
      "Kodava chef on staff",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?auto=format&fit=crop&w=1600&q=80", alt: "Coffee estate landscape" },
      { src: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1600&q=80", alt: "Estate villa exterior" },
      { src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80", alt: "Living area with fireplace" },
      { src: "https://images.unsplash.com/photo-1522444690501-83ea7d5b0d3a?auto=format&fit=crop&w=1600&q=80", alt: "Coffee plantation walk" },
    ],
    houseRules: [
      "Check-in 1pm, check-out 11am",
      "Dogs welcome — please advise breed",
    ],
    locationNote: "Madikeri, Coorg — 5 hr from Bangalore.",
    featured: true,
  },
  {
    slug: "white-sands-alibaug",
    name: "White Sands",
    tagline: "Beachfront retreat behind a coconut grove.",
    description:
      "A short walk to Kihim beach, White Sands is built around an open courtyard and a 20-metre pool. Four ensuite bedrooms, hammocks under the palms, an outdoor cinema for movie nights, and a Goan chef who comes with the house.",
    destinationSlug: "maharashtra",
    state: "Maharashtra",
    city: "Alibaug",
    collections: ["pool-villas", "beachfront", "weekend-escapes"],
    bedrooms: 4,
    maxGuests: 8,
    bathrooms: 4,
    pricePerNight: 44000,
    rating: 4.8,
    reviewCount: 112,
    amenities: [
      "Private Pool",
      "Beachfront",
      "Chef on Call",
      "Wi-Fi",
      "Air Conditioning",
      "Garden",
      "Bonfire",
    ],
    highlights: [
      "5-minute walk to Kihim beach",
      "Outdoor cinema setup",
      "Goan chef included",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=80", alt: "Beachfront villa exterior" },
      { src: "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=1600&q=80", alt: "Pool under coconut palms" },
      { src: "https://images.unsplash.com/photo-1571508601891-ca5e7a713859?auto=format&fit=crop&w=1600&q=80", alt: "Courtyard at White Sands" },
      { src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80", alt: "Outdoor cinema setup" },
    ],
    houseRules: [
      "Check-in 2pm, check-out 11am",
      "No fireworks on the beach",
    ],
    locationNote: "Kihim, Alibaug — ferry from Gateway of India.",
  },
  {
    slug: "deodar-lodge-manali",
    name: "Deodar Lodge",
    tagline: "Three-storey log cabin over the Beas valley.",
    description:
      "A vertical timber cabin in a deodar grove above Old Manali. Plate-glass walls open onto the valley, a hot tub steams on the deck, and the wood-burning stove in the great room is lit for you before arrival. Five bedrooms, ski storage, full kitchen.",
    destinationSlug: "himachal-pradesh",
    state: "Himachal Pradesh",
    city: "Manali",
    collections: ["pet-friendly", "for-large-groups"],
    bedrooms: 5,
    maxGuests: 10,
    bathrooms: 5,
    pricePerNight: 36000,
    rating: 4.75,
    reviewCount: 58,
    amenities: [
      "Mountain View",
      "Hot Tub",
      "Fireplace",
      "Pet Friendly",
      "Wi-Fi",
      "Game Room",
    ],
    highlights: [
      "Outdoor hot tub with valley view",
      "Ski storage and boot dryer",
      "Walking distance to Old Manali cafes",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1551522435-a13afa10f103?auto=format&fit=crop&w=1600&q=80", alt: "Log cabin in the deodars" },
      { src: "https://images.unsplash.com/photo-1518602164578-cd0074062767?auto=format&fit=crop&w=1600&q=80", alt: "Hot tub on the deck" },
      { src: "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?auto=format&fit=crop&w=1600&q=80", alt: "Great room with fireplace" },
      { src: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1600&q=80", alt: "Bedroom with valley window" },
    ],
    houseRules: [
      "Check-in 3pm, check-out 11am",
      "Dogs welcome — fenced garden",
    ],
    locationNote: "Old Manali, Himachal Pradesh — 1.5 hr from Bhuntar airport.",
  },
  {
    slug: "sea-glass-vagator",
    name: "Sea Glass",
    tagline: "Minimalist beach house above a black-rock cove.",
    description:
      "Built into the cliff above Vagator, Sea Glass is a study in white concrete and teak. Three bedrooms, an infinity pool right at the cliff edge, and a private path down to the sand. The kitchen comes with a daily breakfast service.",
    destinationSlug: "goa",
    state: "Goa",
    city: "North Goa",
    collections: ["pool-villas", "beachfront"],
    bedrooms: 3,
    maxGuests: 6,
    bathrooms: 3,
    pricePerNight: 48000,
    rating: 4.9,
    reviewCount: 89,
    amenities: [
      "Private Pool",
      "Sea View",
      "Beachfront",
      "Wi-Fi",
      "Air Conditioning",
      "Chef on Call",
    ],
    highlights: [
      "Cliff-edge infinity pool",
      "Private path to the cove",
      "Daily breakfast included",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=1600&q=80", alt: "Cliff-edge pool at Sea Glass" },
      { src: "https://images.unsplash.com/photo-1505881502353-a1986add3762?auto=format&fit=crop&w=1600&q=80", alt: "Beach view from the deck" },
      { src: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80", alt: "Minimalist bedroom" },
      { src: "https://images.unsplash.com/photo-1610530460358-dc6e21b88e1c?auto=format&fit=crop&w=1600&q=80", alt: "Open kitchen at Sea Glass" },
    ],
    houseRules: [
      "Check-in 2pm, check-out 11am",
      "Adult-friendly — children 10+",
    ],
    locationNote: "Vagator, North Goa — 50 min from Dabolim airport.",
    featured: true,
  },
  {
    slug: "the-orchard-house-lonavala",
    name: "The Orchard House",
    tagline: "Stone-clad farmhouse in an old mango orchard.",
    description:
      "Lower on the Lonavala plateau than the Banyan House, the Orchard House is a quieter, more rustic proposition — stone walls, a wood-fired pizza oven on the lawn, hammocks between the mango trees, a clear plunge pool. Sleeps eight comfortably.",
    destinationSlug: "maharashtra",
    state: "Maharashtra",
    city: "Lonavala",
    collections: ["pet-friendly", "weekend-escapes"],
    bedrooms: 4,
    maxGuests: 8,
    bathrooms: 4,
    pricePerNight: 32000,
    rating: 4.75,
    reviewCount: 71,
    amenities: [
      "Private Pool",
      "Pet Friendly",
      "Fireplace",
      "Wi-Fi",
      "Garden",
      "Bonfire",
    ],
    highlights: [
      "Wood-fired pizza oven",
      "Mango orchard in season",
      "Pet-friendly, fenced lawn",
    ],
    images: [
      { src: "https://images.unsplash.com/photo-1542718610-a1d656d1884c?auto=format&fit=crop&w=1600&q=80", alt: "Stone farmhouse exterior" },
      { src: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1600&q=80", alt: "Plunge pool in the orchard" },
      { src: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1600&q=80", alt: "Living room with fireplace" },
      { src: "https://images.unsplash.com/photo-1502301103665-0b95cc738daf?auto=format&fit=crop&w=1600&q=80", alt: "Lawn and hammocks" },
    ],
    houseRules: [
      "Check-in 2pm, check-out 11am",
      "Dogs welcome — fenced garden",
    ],
    locationNote: "Tikona Peth, Lonavala — 2 hr from Mumbai.",
  },
];

/**
 * Load villas — merge bundled SEED with anything added via the admin
 * dashboard (data/villas.json). Admin entries override seed entries with
 * the same slug. Slugs listed in deleted-villas.json are excluded entirely,
 * which lets admins delete bundled seed villas permanently (otherwise the
 * SEED would just bring them back on every page load).
 */
function loadVillas(): Villa[] {
  const added = readJsonSync<Villa[]>("villas.json", []);
  const deleted = new Set(readJsonSync<string[]>("deleted-villas.json", []));
  const bySlug = new Map<string, Villa>(
    SEED.filter((v) => !deleted.has(v.slug)).map((v) => [v.slug, v]),
  );
  for (const v of added) {
    if (deleted.has(v.slug)) continue;
    bySlug.set(v.slug, v);
  }
  return Array.from(bySlug.values());
}

export function getVillas(): Villa[] {
  return loadVillas();
}

export function getVillaBySlug(slug: string) {
  return loadVillas().find((v) => v.slug === slug);
}

const FEATURED_CAP = 6;

function rankSort<T extends { featuredRank?: number }>(a: T, b: T): number {
  const ra = a.featuredRank;
  const rb = b.featuredRank;
  if (ra === undefined && rb === undefined) return 0;
  if (ra === undefined) return 1;
  if (rb === undefined) return -1;
  return ra - rb;
}

export function getFeaturedVillas() {
  return loadVillas()
    .filter((v) => v.featured && (v.type ?? "villa") === "villa")
    .sort(rankSort)
    .slice(0, FEATURED_CAP);
}

export function getFeaturedApartments() {
  return loadVillas()
    .filter((v) => v.featured && v.type === "apartment")
    .sort(rankSort)
    .slice(0, FEATURED_CAP);
}

export function getVillasByDestination(destinationSlug: string) {
  return loadVillas().filter((v) => v.destinationSlug === destinationSlug);
}

function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getVillasByCity(stateSlug: string, citySlug: string) {
  return loadVillas().filter((v) => {
    if (v.destinationSlug !== stateSlug) return false;
    return slugifyCity(v.city ?? "") === citySlug;
  });
}

/**
 * Index of every state→city that has at least one property of the given type.
 * Used by the header dropdowns ("Villas in North Goa", "Apartments in Mumbai").
 * Only locations with a non-empty `city` are included.
 */
export type CityIndexState = {
  stateSlug: string;
  stateName: string;
  cities: Array<{ slug: string; name: string; count: number }>;
};

export function getCityIndex(type: "villa" | "apartment"): CityIndexState[] {
  const villas = loadVillas().filter((v) => (v.type ?? "villa") === type);
  const stateMap = new Map<
    string,
    { stateName: string; cities: Map<string, { name: string; count: number }> }
  >();

  for (const v of villas) {
    if (!v.city || !v.city.trim()) continue;
    const stateSlug = v.destinationSlug;
    const stateName = v.state ?? stateSlug;
    if (!stateMap.has(stateSlug)) {
      stateMap.set(stateSlug, { stateName, cities: new Map() });
    }
    const entry = stateMap.get(stateSlug)!;
    const citySlug = slugifyCity(v.city);
    if (!entry.cities.has(citySlug)) {
      entry.cities.set(citySlug, { name: v.city, count: 0 });
    }
    entry.cities.get(citySlug)!.count += 1;
  }

  return [...stateMap.entries()]
    .map(([stateSlug, { stateName, cities }]) => ({
      stateSlug,
      stateName,
      cities: [...cities.entries()]
        .map(([slug, c]) => ({ slug, ...c }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.stateName.localeCompare(b.stateName));
}

export function getVillasByCollection(collectionSlug: string) {
  return loadVillas().filter((v) => v.collections.includes(collectionSlug));
}

export type VillaFilters = {
  type?: "villa" | "apartment";
  destination?: string;
  /** State slug, e.g. "goa". Combine with `city` to narrow further. */
  state?: string;
  /** Slugged city, e.g. "north-goa". Only applies if `state` is set. */
  city?: string;
  collection?: string;
  guests?: number;
  bedrooms?: number; // minimum bedrooms (rooms filter)
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  sort?: "featured" | "price-asc" | "price-desc" | "rating";
};

export function getVillasByType(type: "villa" | "apartment") {
  return loadVillas().filter((v) => (v.type ?? "villa") === type);
}

export function getAllAmenities(): string[] {
  const set = new Set<string>();
  for (const v of loadVillas()) {
    for (const a of v.amenities) set.add(a);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/**
 * Fixed price range for the listing filter so users can search budget
 * stays AND luxury stays without being clamped to current data bounds.
 */
export function getPriceBounds(): { min: number; max: number } {
  return { min: 1000, max: 100000 };
}

export function searchVillas(filters: VillaFilters = {}) {
  let results = loadVillas();
  if (filters.type) {
    results = results.filter((v) => (v.type ?? "villa") === filters.type);
  }
  if (filters.destination) {
    results = results.filter((v) => v.destinationSlug === filters.destination);
  }
  if (filters.state) {
    results = results.filter((v) => v.destinationSlug === filters.state);
  }
  if (filters.city) {
    results = results.filter(
      (v) => slugifyCity(v.city ?? "") === filters.city,
    );
  }
  if (filters.collection) {
    results = results.filter((v) => v.collections.includes(filters.collection!));
  }
  if (filters.guests) {
    results = results.filter((v) => v.maxGuests >= filters.guests!);
  }
  if (filters.bedrooms) {
    results = results.filter((v) => v.bedrooms >= filters.bedrooms!);
  }
  if (filters.minPrice) {
    results = results.filter((v) => v.pricePerNight >= filters.minPrice!);
  }
  if (filters.maxPrice) {
    results = results.filter((v) => v.pricePerNight <= filters.maxPrice!);
  }
  if (filters.amenities && filters.amenities.length > 0) {
    results = results.filter((v) =>
      filters.amenities!.every((a) => v.amenities.includes(a as never))
    );
  }
  switch (filters.sort) {
    case "price-asc":
      results.sort((a, b) => a.pricePerNight - b.pricePerNight);
      break;
    case "price-desc":
      results.sort((a, b) => b.pricePerNight - a.pricePerNight);
      break;
    case "rating":
      results.sort((a, b) => b.rating - a.rating);
      break;
    default: {
      // Default "featured" sort, now popularity-aware. Admin manual
      // featuredRank wins inside the featured group; everything else
      // sorts by weighted view score (last-30-day views count double,
      // see getViewScoresSync).
      const scores = getViewScoresSync();
      results.sort((a, b) => {
        const aF = !!a.featured;
        const bF = !!b.featured;
        if (aF && bF) {
          const ra = a.featuredRank ?? Number.POSITIVE_INFINITY;
          const rb = b.featuredRank ?? Number.POSITIVE_INFINITY;
          if (ra !== rb) return ra - rb;
        } else if (aF !== bF) {
          return Number(bF) - Number(aF);
        }
        return (scores[b.slug] ?? 0) - (scores[a.slug] ?? 0);
      });
    }
  }
  return results;
}
