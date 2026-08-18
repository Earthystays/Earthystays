import type {
  AccommodationUnit,
  BedInventory,
  PropertyType,
  RoomInventory,
  Villa,
} from "@/lib/types";

/* ─────────────────────────────────────────────────────────────────────────
 * Accommodation-unit helpers (Phase A).
 *
 * Pure, read-only utilities over the optional `Villa.units` array. They are
 * safe on legacy villa/apartment records (which have no units) and return
 * empty/default values in that case — so nothing existing changes behaviour.
 * ───────────────────────────────────────────────────────────────────────── */

/** Property types that are composed of bookable sub-units. */
export function isMultiUnitType(type: PropertyType | undefined): boolean {
  return type === "hotel" || type === "hostel";
}

/** Whether a property actually carries accommodation units. */
export function hasUnits(villa: Pick<Villa, "units">): boolean {
  return Array.isArray(villa.units) && villa.units.length > 0;
}

/** All units on a property (empty for villas/apartments). */
export function getUnits(villa: Pick<Villa, "units">): AccommodationUnit[] {
  return villa.units ?? [];
}

export function getUnitById(
  villa: Pick<Villa, "units">,
  unitId: string,
): AccommodationUnit | undefined {
  return getUnits(villa).find((u) => u.id === unitId);
}

/** Named beds/rooms that count as bookable (not blocked/maintenance/etc.). */
function isSelectable(
  item: Pick<BedInventory | RoomInventory, "status">,
): boolean {
  return !item.status || item.status === "available";
}

/**
 * Pooled availability for a single unit.
 *
 * Source of truth is the `inventory` count. If the unit opts into named
 * beds/rooms we cross-check: availability is the MINIMUM of the pooled count
 * and the number of selectable named units, so an operator can never oversell
 * past either signal. Blocked-date overlap is layered on in a later phase.
 */
export function unitAvailableCount(unit: AccommodationUnit): number {
  const pooled = Math.max(0, unit.inventory ?? 0);
  const named =
    unit.kind === "dorm"
      ? unit.beds?.filter(isSelectable).length
      : unit.rooms?.filter(isSelectable).length;
  if (named === undefined) return pooled;
  return Math.min(pooled, named);
}

/** Whether at least one bed/room in the unit is available to book. */
export function isUnitAvailable(unit: AccommodationUnit): boolean {
  return unitAvailableCount(unit) > 0;
}

/** Lowest advertised price across a property's units ("Starting from ₹…").
 *  Falls back to the whole-property price for unit-less listings. */
export function startingFromPrice(villa: Pick<Villa, "units" | "pricePerNight">): number {
  const units = getUnits(villa);
  if (units.length === 0) return villa.pricePerNight;
  return units.reduce(
    (min, u) => (u.basePrice < min ? u.basePrice : min),
    units[0].basePrice,
  );
}

/** Total bookable inventory across every unit on the property. */
export function totalAvailableCount(villa: Pick<Villa, "units">): number {
  return getUnits(villa).reduce((sum, u) => sum + unitAvailableCount(u), 0);
}

/**
 * Pure upsert of a unit into a list (matched by id). A new/unknown id is
 * replaced by `mintId(kind)` so callers can't inject arbitrary ids. Returns a
 * new array plus the resolved id. Used by the admin saveUnit server action and
 * covered directly by tests (no Next runtime needed).
 */
export function upsertUnit(
  units: AccommodationUnit[],
  unit: AccommodationUnit,
  mintId: (kind: AccommodationUnit["kind"]) => string,
): { units: AccommodationUnit[]; unitId: string } {
  const known = unit.id && units.some((u) => u.id === unit.id);
  const id = known ? unit.id : mintId(unit.kind);
  const clean: AccommodationUnit = { ...unit, id };
  const idx = units.findIndex((u) => u.id === id);
  const next = [...units];
  if (idx >= 0) next[idx] = clean;
  else next.push(clean);
  return { units: next, unitId: id };
}

/**
 * Build a list of `count` named beds ("Bed 1"…"Bed N"). Existing beds are
 * matched by index and carried over (status/position/notes preserved), so an
 * operator can resize a dorm without losing the states they've already set.
 * Pure & covered by tests.
 */
export function generateBeds(
  count: number,
  existing: BedInventory[] = [],
): BedInventory[] {
  const n = Math.max(0, Math.floor(count));
  return Array.from({ length: n }, (_, i) => {
    const prev = existing[i];
    return {
      id: prev?.id ?? `bed_${i + 1}`,
      label: `Bed ${i + 1}`,
      position: prev?.position,
      status: prev?.status ?? "available",
      notes: prev?.notes,
    };
  });
}

/** Pure removal of a unit by id. */
export function removeUnit(
  units: AccommodationUnit[],
  unitId: string,
): AccommodationUnit[] {
  return units.filter((u) => u.id !== unitId);
}

/** Guest-facing noun for the unit of inventory, driven by property type. */
export function inventoryNoun(
  type: PropertyType | undefined,
  count = 1,
): string {
  if (type === "hotel") return count === 1 ? "Room" : "Rooms";
  if (type === "hostel") return count === 1 ? "Bed" : "Beds";
  return count === 1 ? "Property" : "Properties";
}
