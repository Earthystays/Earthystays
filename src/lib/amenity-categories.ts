/** Category buckets for grouping amenities on the villa detail page,
 *  modeled on Airbnb's grouped view. Each amenity name (lowercased)
 *  maps to its category. Unmatched amenities land in "Other".
 *
 *  Custom amenities can opt into a category by including a known
 *  keyword in the name (e.g. "Geyser" → matches "geyser" → Bathroom). */

export type AmenityCategory =
  | "Bathroom"
  | "Bedroom & laundry"
  | "Entertainment"
  | "Heating & cooling"
  | "Home safety"
  | "Internet & office"
  | "Kitchen & dining"
  | "Outdoor"
  | "Parking & facilities"
  | "Pool & wellness"
  | "Services"
  | "Family"
  | "Views & location"
  | "Other";

/** Category display order (used in modal). */
export const CATEGORY_ORDER: readonly AmenityCategory[] = [
  "Pool & wellness",
  "Outdoor",
  "Kitchen & dining",
  "Internet & office",
  "Heating & cooling",
  "Bedroom & laundry",
  "Bathroom",
  "Entertainment",
  "Services",
  "Family",
  "Parking & facilities",
  "Home safety",
  "Views & location",
  "Other",
] as const;

/** Exact-name → category mapping (lowercased keys). */
const EXACT: Record<string, AmenityCategory> = {
  // Pool & wellness
  "private pool": "Pool & wellness",
  pool: "Pool & wellness",
  "shared pool": "Pool & wellness",
  "hot tub": "Pool & wellness",
  jacuzzi: "Pool & wellness",
  spa: "Pool & wellness",
  sauna: "Pool & wellness",
  "steam/sauna": "Pool & wellness",
  steam: "Pool & wellness",
  gym: "Pool & wellness",
  yoga: "Pool & wellness",
  "yoga deck": "Pool & wellness",

  // Outdoor
  beachfront: "Outdoor",
  garden: "Outdoor",
  "back garden": "Outdoor",
  lawn: "Outdoor",
  gazebo: "Outdoor",
  bonfire: "Outdoor",
  "bonfire pit": "Outdoor",
  "outdoor dining": "Outdoor",
  "outdoor shower": "Outdoor",
  "bbq grill": "Outdoor",
  bbq: "Outdoor",
  patio: "Outdoor",
  balcony: "Outdoor",
  terrace: "Outdoor",
  "balcony/terrace": "Outdoor",
  "flower garden": "Outdoor",
  "walking trails": "Outdoor",

  // Kitchen & dining
  kitchen: "Kitchen & dining",
  fridge: "Kitchen & dining",
  refrigerator: "Kitchen & dining",
  microwave: "Kitchen & dining",
  "crockery and cutlery": "Kitchen & dining",
  crockery: "Kitchen & dining",
  cutlery: "Kitchen & dining",
  stove: "Kitchen & dining",
  oven: "Kitchen & dining",
  "coffee maker": "Kitchen & dining",
  "espresso machine": "Kitchen & dining",
  kettle: "Kitchen & dining",
  toaster: "Kitchen & dining",
  "wine glasses": "Kitchen & dining",
  dishwasher: "Kitchen & dining",
  "cooking basics": "Kitchen & dining",
  "dining table": "Kitchen & dining",
  bar: "Kitchen & dining",
  wine: "Kitchen & dining",
  freezer: "Kitchen & dining",
  cooker: "Kitchen & dining",
  blender: "Kitchen & dining",
  "water purifier": "Kitchen & dining",
  "breakfast included": "Kitchen & dining",

  // Internet & office
  "wi-fi": "Internet & office",
  wifi: "Internet & office",
  "dedicated workspace": "Internet & office",
  ethernet: "Internet & office",
  "conference room": "Internet & office",
  printer: "Internet & office",

  // Heating & cooling
  "air conditioning": "Heating & cooling",
  ac: "Heating & cooling",
  "ceiling fan": "Heating & cooling",
  heating: "Heating & cooling",
  fireplace: "Heating & cooling",
  "indoor fireplace": "Heating & cooling",

  // Bedroom & laundry
  "washing machine": "Bedroom & laundry",
  essentials: "Bedroom & laundry",
  hangers: "Bedroom & laundry",
  "bed linen": "Bedroom & laundry",
  iron: "Bedroom & laundry",
  closet: "Bedroom & laundry",
  wardrobe: "Bedroom & laundry",
  blackouts: "Bedroom & laundry",
  "blackout curtains": "Bedroom & laundry",
  laundry: "Bedroom & laundry",
  dryer: "Bedroom & laundry",
  workstation: "Bedroom & laundry",
  "extra mattress": "Bedroom & laundry",
  "electric blanket": "Bedroom & laundry",

  // Bathroom
  hairdryer: "Bathroom",
  "hair dryer": "Bathroom",
  "cleaning products": "Bathroom",
  shampoo: "Bathroom",
  conditioner: "Bathroom",
  "hot water": "Bathroom",
  geyser: "Bathroom",
  "shower gel": "Bathroom",
  "body soap": "Bathroom",
  towels: "Bathroom",
  toiletries: "Bathroom",
  bathtub: "Bathroom",

  // Entertainment
  tv: "Entertainment",
  "smart tv": "Entertainment",
  "cable tv": "Entertainment",
  netflix: "Entertainment",
  speakers: "Entertainment",
  "sound system": "Entertainment",
  "music system": "Entertainment",
  "music system/speaker": "Entertainment",
  "board games": "Entertainment",
  books: "Entertainment",
  "game room": "Entertainment",
  "pool table": "Entertainment",
  "table tennis": "Entertainment",
  music: "Entertainment",
  "home theatre": "Entertainment",
  "home theater": "Entertainment",
  "indoor/outdoor games": "Entertainment",
  "movie screen": "Entertainment",

  // Services
  "chef on call": "Services",
  caretaker: "Services",
  housekeeping: "Services",
  concierge: "Services",
  butler: "Services",
  "in-house chef": "Services",
  "cook available": "Services",
  "smoking allowed": "Services",
  "self check-in": "Services",
  "building staff": "Services",
  "driver/staff accommodation": "Services",

  // Family
  "kids play area": "Family",
  crib: "Family",
  "high chair": "Family",
  "pack 'n play": "Family",
  "baby monitor": "Family",
  "pet friendly": "Family",
  "kids welcome": "Family",

  // Parking & facilities
  parking: "Parking & facilities",
  "free parking": "Parking & facilities",
  "paid parking": "Parking & facilities",
  "indoor parking": "Parking & facilities",
  "ev charging": "Parking & facilities",
  "wheelchair access": "Parking & facilities",
  "wheelchair friendly": "Parking & facilities",
  "power backup": "Parking & facilities",
  "private entrance": "Parking & facilities",
  elevator: "Parking & facilities",
  lift: "Parking & facilities",
  "launderette nearby": "Parking & facilities",

  // Home safety
  "smoke alarm": "Home safety",
  "fire extinguisher": "Home safety",
  "first aid kit": "Home safety",
  "carbon monoxide alarm": "Home safety",
  "co alarm": "Home safety",
  "security cameras": "Home safety",
  cctv: "Home safety",
  "24/7 security": "Home safety",
  "safe box": "Home safety",
  safe: "Home safety",

  // Views & location
  "sea view": "Views & location",
  "mountain view": "Views & location",
  "valley view": "Views & location",
  "river view": "Views & location",
  "lake view": "Views & location",
  "city view": "Views & location",
  "forest view": "Views & location",
};

/** Substring fallback rules. Earliest match wins. */
const FALLBACK_RULES: Array<{ match: RegExp; category: AmenityCategory }> = [
  { match: /(pool|spa|gym|sauna|yoga|jacuzzi|hot ?tub)/i, category: "Pool & wellness" },
  { match: /(garden|patio|balcony|terrace|bbq|grill|bonfire|outdoor)/i, category: "Outdoor" },
  { match: /(kitchen|fridge|micro|stove|oven|coffee|kettle|toaster|dish|wine|bar)/i, category: "Kitchen & dining" },
  { match: /(wifi|wi-?fi|internet|ethernet|workspace|conference|printer)/i, category: "Internet & office" },
  { match: /(air ?conditioning|\bac\b|fan|heating|fireplace)/i, category: "Heating & cooling" },
  { match: /(wash|laundry|dryer|hanger|linen|iron|closet|wardrobe|blackout)/i, category: "Bedroom & laundry" },
  { match: /(towel|shampoo|condition|soap|toiletries|hair|shower|bathtub|geyser|hot ?water)/i, category: "Bathroom" },
  { match: /(tv|netflix|speaker|sound|game|board|book|music|pool table)/i, category: "Entertainment" },
  { match: /(chef|housekeep|caretaker|concierge|butler|service)/i, category: "Services" },
  { match: /(kid|child|crib|baby|family|pet)/i, category: "Family" },
  { match: /(park|charging|wheelchair|backup|entrance|elevator)/i, category: "Parking & facilities" },
  { match: /(smoke|alarm|extinguisher|first aid|cctv|security|safe)/i, category: "Home safety" },
  { match: /(view)/i, category: "Views & location" },
];

export function categorizeAmenity(name: string): AmenityCategory {
  const key = name.toLowerCase().trim();
  if (EXACT[key]) return EXACT[key];
  for (const rule of FALLBACK_RULES) {
    if (rule.match.test(key)) return rule.category;
  }
  return "Other";
}

/** Group an array of amenities by category, preserving CATEGORY_ORDER and
 *  the original insertion order within each category. Empty categories
 *  are dropped from the result. */
export function groupAmenitiesByCategory<T extends { name: string }>(
  items: T[],
): Array<{ category: AmenityCategory; items: T[] }> {
  const buckets = new Map<AmenityCategory, T[]>();
  for (const item of items) {
    const cat = categorizeAmenity(item.name);
    const arr = buckets.get(cat) ?? [];
    arr.push(item);
    buckets.set(cat, arr);
  }
  const out: Array<{ category: AmenityCategory; items: T[] }> = [];
  for (const cat of CATEGORY_ORDER) {
    const arr = buckets.get(cat);
    if (arr && arr.length > 0) out.push({ category: cat, items: arr });
  }
  return out;
}
