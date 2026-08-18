import { describe, it, expect } from "vitest";
import {
  getVillas,
  getVillaBySlug,
  getVillasByType,
  searchVillas,
} from "./villas";

/**
 * VILLA REGRESSION BASELINE (Phase A).
 *
 * Captures the invariants of the existing villa system BEFORE any hotel/hostel
 * feature is built. If a later phase breaks how legacy villas load, resolve,
 * or search, one of these fails. Nothing here asserts hotel/hostel behaviour —
 * it only guards what already works.
 */
describe("villa regression baseline", () => {
  const villas = getVillas();

  it("loads a non-empty catalogue", () => {
    expect(villas.length).toBeGreaterThan(0);
  });

  it("every villa has the fields the detail page & cards rely on", () => {
    for (const v of villas) {
      expect(typeof v.slug).toBe("string");
      expect(v.slug.length).toBeGreaterThan(0);
      expect(typeof v.name).toBe("string");
      expect(typeof v.pricePerNight).toBe("number");
      expect(Number.isFinite(v.pricePerNight)).toBe(true);
      expect(typeof v.maxGuests).toBe("number");
      expect(Array.isArray(v.images)).toBe(true);
      expect(Array.isArray(v.amenities)).toBe(true);
    }
  });

  it("slugs are unique", () => {
    const slugs = villas.map((v) => v.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("getVillaBySlug resolves every listed villa", () => {
    for (const v of villas) {
      expect(getVillaBySlug(v.slug)?.slug).toBe(v.slug);
    }
  });

  it("legacy villas carry no units (whole-property model intact)", () => {
    // Phase A adds an OPTIONAL units[]. No existing record should have gained
    // units as a side effect of the type change.
    for (const v of villas) {
      expect(v.units === undefined || v.units.length === 0).toBe(true);
    }
  });

  it("type filtering still returns only the requested type", () => {
    for (const type of ["villa", "apartment"] as const) {
      for (const v of getVillasByType(type)) {
        // getVillasByType treats missing type as "villa".
        expect((v.type ?? "villa")).toBe(type);
      }
    }
  });

  it("empty search returns the full public catalogue", () => {
    expect(searchVillas({}).length).toBe(villas.length);
  });
});
