import { readJsonSync } from "@/lib/storage";

export type AmenityKind = "amenity" | "facility";

export type StoredAmenity = {
  name: string; // display label, e.g. "Espresso Machine"
  icon: string; // lucide icon name, e.g. "Coffee"
  kind: AmenityKind;
};

const FILE = "amenities.json";

export function getStoredAmenities(): StoredAmenity[] {
  return readJsonSync<StoredAmenity[]>(FILE, []);
}

export function getCustomAmenityNames(): string[] {
  return getStoredAmenities()
    .filter((a) => a.kind === "amenity")
    .map((a) => a.name);
}

export function getCustomFacilityNames(): string[] {
  return getStoredAmenities()
    .filter((a) => a.kind === "facility")
    .map((a) => a.name);
}

/** name (lowercased) → icon name for admin-defined entries. */
export function getCustomIconMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const a of getStoredAmenities()) {
    map[a.name.toLowerCase().trim()] = a.icon;
  }
  return map;
}
