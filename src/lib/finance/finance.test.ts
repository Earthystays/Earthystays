/**
 * Finance engine tests (pure) — Phase 1B.5 Phase C.
 * Cancellation tiers, GST thresholds (5%/18%), experience GST, commission.
 */
import { describe, expect, it } from "vitest";
import {
  buildCancellationSnapshot,
  refundBpsFor,
} from "./cancellation-policies";
import { buildCommissionSnapshot, resolveCommissionBps } from "./commission";
import {
  ACCOMMODATION_GST_THRESHOLD_PAISE,
  accommodationRateBps,
  computeAccommodationTax,
  computeExperienceTax,
} from "./tax";

describe("cancellation policy tiers (locked V1)", () => {
  it("flexible: 100% at 7+, 50% at 3–6, 0% within 72h", () => {
    expect(refundBpsFor("flexible", 10)).toBe(10000);
    expect(refundBpsFor("flexible", 7)).toBe(10000);
    expect(refundBpsFor("flexible", 5)).toBe(5000);
    expect(refundBpsFor("flexible", 2)).toBe(0);
  });
  it("moderate: 100% at 14+, 50% at 7–13, 0% within 7", () => {
    expect(refundBpsFor("moderate", 14)).toBe(10000);
    expect(refundBpsFor("moderate", 10)).toBe(5000);
    expect(refundBpsFor("moderate", 6)).toBe(0);
  });
  it("strict: 50% at 30+, 25% at 15–29, 0% within 15", () => {
    expect(refundBpsFor("strict", 30)).toBe(5000);
    expect(refundBpsFor("strict", 20)).toBe(2500);
    expect(refundBpsFor("strict", 14)).toBe(0);
  });
  it("snapshot is self-contained and versioned", () => {
    const snap = buildCancellationSnapshot("strict");
    expect(snap.policyType).toBe("strict");
    expect(snap.version).toBe(1);
    expect(snap.tiers).toHaveLength(3);
  });
});

describe("accommodation GST (per unit per day)", () => {
  it("charges 5% at or below ₹7,500/night", () => {
    expect(accommodationRateBps(ACCOMMODATION_GST_THRESHOLD_PAISE)).toBe(500);
    const tax = computeAccommodationTax({ nightlyPaise: 750000, nights: 2, units: 1 });
    expect(tax.rateBps).toBe(500);
    expect(tax.taxableAmountPaise).toBe(1500000);
    expect(tax.gstPaise).toBe(75000); // 5% of ₹15,000
  });
  it("charges 18% above ₹7,500/night", () => {
    const tax = computeAccommodationTax({ nightlyPaise: 750001, nights: 1, units: 1 });
    expect(tax.rateBps).toBe(1800);
  });
  it("evaluates threshold per unit per day, applies rate to full base", () => {
    // ₹10,000/night × 3 nights × 2 units = ₹60,000 base, 18%
    const tax = computeAccommodationTax({ nightlyPaise: 1000000, nights: 3, units: 2 });
    expect(tax.rateBps).toBe(1800);
    expect(tax.taxableAmountPaise).toBe(6000000);
    expect(tax.gstPaise).toBe(1080000); // ₹10,800
  });
});

describe("experience GST (5% provisional)", () => {
  it("is 5% and flagged pending CA confirmation", () => {
    const tax = computeExperienceTax(500000);
    expect(tax.rateBps).toBe(500);
    expect(tax.gstPaise).toBe(25000);
    expect(tax.pendingCaConfirmation).toBe(true);
  });
});

describe("commission (V1 15%)", () => {
  it("is 1500 bps for both kinds", () => {
    expect(resolveCommissionBps("property")).toBe(1500);
    expect(resolveCommissionBps("experience")).toBe(1500);
    expect(buildCommissionSnapshot("property").rateBps).toBe(1500);
  });
});
