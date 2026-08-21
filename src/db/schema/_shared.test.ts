/**
 * Money primitive tests — Phase 1B.5 Phase A.
 *
 * These are pure and require NO database. They lock the money contract
 * (integer paise, basis points, half-up rounding) that every later financial
 * phase depends on. The worked example from the spec (§14) is included.
 */
import { describe, expect, it } from "vitest";
import { applyBps, paiseToRupees, roundHalfUp, rupeesToPaise } from "./_shared";

describe("roundHalfUp", () => {
  it("rounds to nearest integer", () => {
    expect(roundHalfUp(10.4)).toBe(10);
    expect(roundHalfUp(10.6)).toBe(11);
  });

  it("rounds an exact half away from zero (half-up)", () => {
    expect(roundHalfUp(0.5)).toBe(1);
    expect(roundHalfUp(1.5)).toBe(2);
    expect(roundHalfUp(2.5)).toBe(3);
    expect(roundHalfUp(-0.5)).toBe(-1);
    expect(roundHalfUp(-2.5)).toBe(-3);
  });

  it("leaves integers untouched", () => {
    expect(roundHalfUp(0)).toBe(0);
    expect(roundHalfUp(300000)).toBe(300000);
  });

  it("throws on non-finite input", () => {
    expect(() => roundHalfUp(NaN)).toThrow();
    expect(() => roundHalfUp(Infinity)).toThrow();
  });
});

describe("rupeesToPaise / paiseToRupees", () => {
  it("converts whole rupees to paise", () => {
    expect(rupeesToPaise(20000)).toBe(2000000); // ₹20,000
    expect(rupeesToPaise(7500)).toBe(750000); // GST threshold
  });

  it("converts fractional rupees half-up", () => {
    expect(rupeesToPaise(0.005)).toBe(1); // half a paise rounds up to 1
    expect(rupeesToPaise(123.455)).toBe(12346); // .5 paise → up
  });

  it("round-trips display values", () => {
    expect(paiseToRupees(2000000)).toBe(20000);
    expect(paiseToRupees(1700000)).toBe(17000);
  });
});

describe("applyBps", () => {
  it("applies 15% commission (1500 bps)", () => {
    // 15% of ₹20,000 = ₹3,000
    expect(applyBps(2000000, 1500)).toBe(300000);
  });

  it("applies 5% GST (500 bps)", () => {
    // 5% of ₹5,000 = ₹250
    expect(applyBps(500000, 500)).toBe(25000);
  });

  it("applies 18% GST (1800 bps)", () => {
    // 18% of ₹10,000 = ₹1,800
    expect(applyBps(1000000, 1800)).toBe(180000);
  });

  it("rounds half-up on non-exact rates", () => {
    // 15% of ₹333.33 (33333 paise) = 4999.95 → 5000 paise
    expect(applyBps(33333, 1500)).toBe(5000);
  });
});

describe("spec §14 worked example — ₹20,000 villa, 5% GST", () => {
  const accommodationPaise = rupeesToPaise(20000);
  const gstBps = 500; // 5%
  const commissionBps = 1500; // 15%

  it("computes GST, guest total, commission and host payable", () => {
    const gst = applyBps(accommodationPaise, gstBps);
    const guestTotal = accommodationPaise + gst;
    // Commission is on FINAL RETAINED REVENUE, EXCLUDING GST.
    const finalRetainedRevenue = accommodationPaise; // no discount/refund
    const commission = applyBps(finalRetainedRevenue, commissionBps);
    const hostPayable = finalRetainedRevenue - commission;

    expect(gst).toBe(rupeesToPaise(1000)); // ₹1,000
    expect(guestTotal).toBe(rupeesToPaise(21000)); // ₹21,000
    expect(commission).toBe(rupeesToPaise(3000)); // ₹3,000
    expect(hostPayable).toBe(rupeesToPaise(17000)); // ₹17,000

    // Invariant #3: host payable + commission = final retained revenue.
    expect(hostPayable + commission).toBe(finalRetainedRevenue);
  });
});
