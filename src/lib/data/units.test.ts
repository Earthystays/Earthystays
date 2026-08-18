import { describe, it, expect } from "vitest";
import type { AccommodationUnit, Villa } from "@/lib/types";
import {
  generateBeds,
  getUnits,
  getUnitById,
  hasUnits,
  inventoryNoun,
  isMultiUnitType,
  effectiveUnitPrice,
  effectiveUnitUnits,
  isUnitAvailable,
  isWeekendDate,
  nightsInRange,
  rangeIsBlocked,
  removeUnit,
  startingFromPrice,
  totalAvailableCount,
  unitAvailableCount,
  unitAvailableForRange,
  upsertUnit,
} from "./units";

const room = (over: Partial<AccommodationUnit> = {}): AccommodationUnit => ({
  id: "u1",
  kind: "room",
  name: "Deluxe Room",
  maxGuests: 2,
  inventory: 8,
  basePrice: 4500,
  ...over,
});

const villa = (over: Partial<Villa> = {}): Villa =>
  ({ slug: "x", name: "X", pricePerNight: 40000, ...over }) as Villa;

describe("units helpers", () => {
  it("identifies multi-unit property types", () => {
    expect(isMultiUnitType("hotel")).toBe(true);
    expect(isMultiUnitType("hostel")).toBe(true);
    expect(isMultiUnitType("villa")).toBe(false);
    expect(isMultiUnitType(undefined)).toBe(false);
  });

  it("treats unit-less (legacy) villas as having no units", () => {
    const v = villa();
    expect(hasUnits(v)).toBe(false);
    expect(getUnits(v)).toEqual([]);
    expect(totalAvailableCount(v)).toBe(0);
    expect(startingFromPrice(v)).toBe(40000);
  });

  it("looks units up by id", () => {
    const v = villa({ units: [room({ id: "a" }), room({ id: "b" })] });
    expect(getUnitById(v, "b")?.id).toBe("b");
    expect(getUnitById(v, "zzz")).toBeUndefined();
  });

  it("pooled availability uses the inventory count", () => {
    expect(unitAvailableCount(room({ inventory: 5 }))).toBe(5);
    expect(isUnitAvailable(room({ inventory: 0 }))).toBe(false);
  });

  it("never oversells past selectable named beds", () => {
    const dorm = room({
      kind: "dorm",
      inventory: 8,
      beds: [
        { id: "b1", label: "Bed 1", status: "available" },
        { id: "b2", label: "Bed 2", status: "booked" },
        { id: "b3", label: "Bed 3", status: "maintenance" },
        { id: "b4", label: "Bed 4" }, // undefined status => available
      ],
    });
    // pooled 8 but only 2 selectable beds -> min = 2
    expect(unitAvailableCount(dorm)).toBe(2);
  });

  it("caps availability by the smaller of pooled vs named", () => {
    const r = room({
      inventory: 1,
      rooms: [
        { id: "101", number: "101", status: "available" },
        { id: "102", number: "102", status: "available" },
      ],
    });
    expect(unitAvailableCount(r)).toBe(1);
  });

  it("startingFrom picks the cheapest unit", () => {
    const v = villa({
      units: [room({ basePrice: 7500 }), room({ basePrice: 4500 })],
    });
    expect(startingFromPrice(v)).toBe(4500);
  });

  it("totals availability across units", () => {
    const v = villa({
      units: [room({ inventory: 3 }), room({ inventory: 2 })],
    });
    expect(totalAvailableCount(v)).toBe(5);
  });

  it("upsert mints a fresh id for new units and ignores client-supplied ids", () => {
    let n = 0;
    const mint = () => `srv_${n++}`;
    const { units, unitId } = upsertUnit([], room({ id: "hacked" }), mint);
    expect(unitId).toBe("srv_0");
    expect(units).toHaveLength(1);
    expect(units[0].id).toBe("srv_0");
  });

  it("upsert updates in place when the id already exists", () => {
    const mint = () => "should-not-be-called";
    const existing = [room({ id: "u1", name: "Deluxe", basePrice: 4500 })];
    const { units, unitId } = upsertUnit(
      existing,
      room({ id: "u1", name: "Deluxe Renamed", basePrice: 5000 }),
      mint,
    );
    expect(unitId).toBe("u1");
    expect(units).toHaveLength(1);
    expect(units[0].name).toBe("Deluxe Renamed");
    expect(units[0].basePrice).toBe(5000);
    expect(existing[0].name).toBe("Deluxe"); // original not mutated
  });

  it("remove drops the matching unit only", () => {
    const list = [room({ id: "a" }), room({ id: "b" })];
    const next = removeUnit(list, "a");
    expect(next.map((u) => u.id)).toEqual(["b"]);
    expect(list).toHaveLength(2); // original not mutated
  });

  it("generates sequentially labelled beds", () => {
    const beds = generateBeds(3);
    expect(beds.map((b) => b.label)).toEqual(["Bed 1", "Bed 2", "Bed 3"]);
    expect(beds.every((b) => b.status === "available")).toBe(true);
  });

  it("preserves existing bed statuses when resizing up", () => {
    const existing = generateBeds(2);
    existing[0].status = "booked";
    existing[1].status = "maintenance";
    const bigger = generateBeds(4, existing);
    expect(bigger).toHaveLength(4);
    expect(bigger[0].status).toBe("booked");
    expect(bigger[1].status).toBe("maintenance");
    expect(bigger[2].status).toBe("available");
  });

  it("shrinking drops trailing beds", () => {
    const beds = generateBeds(2, generateBeds(8));
    expect(beds.map((b) => b.label)).toEqual(["Bed 1", "Bed 2"]);
  });

  it("named-bed statuses feed availability", () => {
    const beds = generateBeds(8);
    beds[0].status = "booked";
    beds[1].status = "maintenance";
    const dorm = room({ kind: "dorm", inventory: 8, beds });
    expect(unitAvailableCount(dorm)).toBe(6);
  });

  it("nightsInRange lists booked nights, excluding checkout day", () => {
    expect(nightsInRange("2026-09-12", "2026-09-15")).toEqual([
      "2026-09-12",
      "2026-09-13",
      "2026-09-14",
    ]);
    expect(nightsInRange("2026-09-12", "2026-09-13")).toEqual(["2026-09-12"]);
  });

  it("nightsInRange handles invalid/empty ranges", () => {
    expect(nightsInRange()).toEqual([]);
    expect(nightsInRange("2026-09-15", "2026-09-12")).toEqual([]); // end<=start
    expect(nightsInRange("2026-09-12", "2026-09-12")).toEqual([]); // zero nights
  });

  it("rangeIsBlocked detects any overlapping night", () => {
    const blocked = ["2026-09-14"];
    expect(rangeIsBlocked(blocked, "2026-09-12", "2026-09-15")).toBe(true);
    // 12→14 books nights 12,13 — the block on the 14th (checkout day) is fine
    expect(rangeIsBlocked(blocked, "2026-09-12", "2026-09-14")).toBe(false);
    expect(rangeIsBlocked([], "2026-09-12", "2026-09-15")).toBe(false);
  });

  it("unitAvailableForRange falls back to pooled count without dates", () => {
    expect(unitAvailableForRange(room({ inventory: 5 }))).toBe(5);
  });

  it("unitAvailableForRange zeroes out when a night is blocked", () => {
    const r = room({ inventory: 5 });
    expect(
      unitAvailableForRange(r, {
        unitBlocked: ["2026-09-13"],
        checkIn: "2026-09-12",
        checkOut: "2026-09-15",
      }),
    ).toBe(0);
    expect(
      unitAvailableForRange(r, {
        propertyBlocked: ["2026-09-20"],
        checkIn: "2026-09-12",
        checkOut: "2026-09-15",
      }),
    ).toBe(5); // block outside the range
  });

  it("detects Fri/Sat as weekend", () => {
    expect(isWeekendDate("2026-08-21")).toBe(true); // Friday
    expect(isWeekendDate("2026-08-22")).toBe(true); // Saturday
    expect(isWeekendDate("2026-08-23")).toBe(false); // Sunday
    expect(isWeekendDate("2026-08-18")).toBe(false); // Tuesday
  });

  it("effectiveUnitPrice: override > weekend > base", () => {
    const u = { basePrice: 4500, weekendPrice: 5500 };
    expect(effectiveUnitPrice(u, "2026-08-18")).toBe(4500); // weekday
    expect(effectiveUnitPrice(u, "2026-08-22")).toBe(5500); // Saturday
    expect(effectiveUnitPrice(u, "2026-08-22", { price: 9999 })).toBe(9999); // override
    expect(effectiveUnitPrice({ basePrice: 4500 }, "2026-08-22")).toBe(4500); // no weekend set
  });

  it("effectiveUnitUnits: blocked > override > inventory", () => {
    const u = { inventory: 8 };
    expect(effectiveUnitUnits(u, "2026-08-18")).toBe(8);
    expect(effectiveUnitUnits(u, "2026-08-18", { units: 3 })).toBe(3);
    expect(effectiveUnitUnits(u, "2026-08-18", { units: 3 }, ["2026-08-18"])).toBe(0);
  });

  it("uses type-correct guest nouns", () => {
    expect(inventoryNoun("hotel", 1)).toBe("Room");
    expect(inventoryNoun("hotel", 2)).toBe("Rooms");
    expect(inventoryNoun("hostel", 1)).toBe("Bed");
    expect(inventoryNoun("hostel", 3)).toBe("Beds");
    expect(inventoryNoun("villa", 1)).toBe("Property");
  });
});
