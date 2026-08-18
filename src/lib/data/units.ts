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

/**
 * The night-start dates ("YYYY-MM-DD") a stay occupies: check-in through the
 * night before check-out. Checkout day itself is not a booked night. Returns
 * [] for an invalid or empty range. Computed in UTC to avoid DST drift.
 */
export function nightsInRange(checkIn?: string, checkOut?: string): string[] {
  if (!checkIn || !checkOut) return [];
  const start = Date.parse(`${checkIn}T00:00:00Z`);
  const end = Date.parse(`${checkOut}T00:00:00Z`);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return [];
  const out: string[] = [];
  const DAY = 86400000;
  for (let t = start; t < end; t += DAY) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

/** Whether any night in [checkIn, checkOut) is present in `blocked`. */
export function rangeIsBlocked(
  blocked: Iterable<string>,
  checkIn?: string,
  checkOut?: string,
): boolean {
  const set = blocked instanceof Set ? blocked : new Set(blocked);
  if (set.size === 0) return false;
  return nightsInRange(checkIn, checkOut).some((d) => set.has(d));
}

/**
 * Date-aware availability for a unit. Base is the pooled/named count; if a
 * date range is given and any of its nights is blocked (per-unit block or a
 * property-wide block), the unit is unavailable (0) for that stay.
 *
 * With no date range this is just `unitAvailableCount` — matching the guest
 * cards, which are date-independent in v1.
 */
export function unitAvailableForRange(
  unit: AccommodationUnit,
  opts: {
    unitBlocked?: Iterable<string>;
    propertyBlocked?: Iterable<string>;
    checkIn?: string;
    checkOut?: string;
  } = {},
): number {
  const base = unitAvailableCount(unit);
  if (base <= 0) return 0;
  const { checkIn, checkOut } = opts;
  if (!checkIn || !checkOut) return base;
  const blocked = new Set<string>([
    ...(opts.unitBlocked ?? []),
    ...(opts.propertyBlocked ?? []),
  ]);
  return rangeIsBlocked(blocked, checkIn, checkOut) ? 0 : base;
}

/** Weekend = Friday or Saturday night (typical for Indian leisure stays). */
export function isWeekendDate(dateStr: string): boolean {
  const t = Date.parse(`${dateStr}T00:00:00Z`);
  if (Number.isNaN(t)) return false;
  const day = new Date(t).getUTCDay(); // 0 Sun … 6 Sat
  return day === 5 || day === 6;
}

/**
 * Effective nightly price for a unit on a date (calendar — Phase 21):
 * per-date override → weekend price (on Fri/Sat) → base price.
 */
export function effectiveUnitPrice(
  unit: Pick<AccommodationUnit, "basePrice" | "weekendPrice">,
  dateStr: string,
  override?: { price?: number },
): number {
  if (override?.price != null) return override.price;
  if (isWeekendDate(dateStr) && unit.weekendPrice != null) return unit.weekendPrice;
  return unit.basePrice;
}

/**
 * Effective bookable units for a unit on a date: 0 if the date is blocked,
 * else the per-date override count, else the unit's pooled inventory.
 */
export function effectiveUnitUnits(
  unit: Pick<AccommodationUnit, "inventory">,
  dateStr: string,
  override?: { units?: number },
  blocked?: Iterable<string>,
): number {
  if (blocked) {
    const set = blocked instanceof Set ? blocked : new Set(blocked);
    if (set.has(dateStr)) return 0;
  }
  if (override?.units != null) return Math.max(0, override.units);
  return Math.max(0, unit.inventory ?? 0);
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
