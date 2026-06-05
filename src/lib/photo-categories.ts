/**
 * Auto-classify a villa photo into Outdoors / Indoors / Bed & Bath / Other
 * based on keywords in the alt text. Falls back to "Other" if nothing matches.
 */

export const PHOTO_CATEGORIES = ["Outdoors", "Indoors", "Bed & Bath", "Other"] as const;
export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

const OUTDOORS = [
  "pool",
  "garden",
  "exterior",
  "outdoor",
  "view",
  "courtyard",
  "lawn",
  "beach",
  "deck",
  "terrace",
  "patio",
  "facade",
  "veranda",
  "rooftop",
  "estate",
  "cliff",
  "yard",
  "balcony",
  "porch",
  "sunset",
  "hot tub",
  "bonfire",
  "plantation",
];

const BED_BATH = ["bed", "bath", "suite", "bedroom", "shower"];

const INDOORS = [
  "living",
  "kitchen",
  "dining",
  "hall",
  "fireplace",
  "lobby",
  "lounge",
  "den",
  "study",
  "library",
  "game",
  "wall detail",
  "interior",
];

export function categorizePhoto(alt: string | undefined | null): PhotoCategory {
  if (!alt) return "Other";
  const a = alt.toLowerCase();
  if (BED_BATH.some((k) => a.includes(k))) return "Bed & Bath";
  if (OUTDOORS.some((k) => a.includes(k))) return "Outdoors";
  if (INDOORS.some((k) => a.includes(k))) return "Indoors";
  return "Other";
}
