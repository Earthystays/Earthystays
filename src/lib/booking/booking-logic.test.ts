/**
 * Booking pure-logic tests — Phase 1B.5 Phase C. No database required.
 * Covers overlap semantics, booking-number format, mock provider behaviour,
 * and buildBookingDraft (snapshots, host safety, INR-only, totals).
 */
import { describe, expect, it } from "vitest";
import { INTERNAL_EARTHY_USER_ID } from "../../db/internal-entity";
import { MockPaymentProvider } from "../payments/mock-provider";
import { formatBookingNumber, isBookingNumber } from "./booking-number";
import { BookingError } from "./errors";
import { nightsBetween, rangesOverlap, stayRange } from "./overlap";
import {
  buildBookingDraft,
  type ResolvedExperience,
  type ResolvedProperty,
} from "./quote";

const AT = new Date("2026-08-21T10:00:00.000Z");

const activeProperty: ResolvedProperty = {
  slug: "oceanview-villa",
  status: "active",
  hostId: "usr_testhost_001",
  baseNightlyPricePaise: 2450000, // ₹24,500 → 18% GST
  cancellationPolicy: "strict",
};
const earthyOwnedProperty: ResolvedProperty = {
  ...activeProperty,
  slug: "azul-penthouse",
  hostId: null, // Earthy-owned
  baseNightlyPricePaise: 1000000, // ₹10,000
  cancellationPolicy: null,
};
const mappedExperience: ResolvedExperience = {
  slug: "old-goa-food-walk",
  status: "active",
  hostUserId: "usr_realhost_x",
  hostPersonaId: "host_prateek",
  priceFromPaise: 250000,
};
const unmappedExperience: ResolvedExperience = {
  ...mappedExperience,
  hostUserId: null, // persona never mapped to a payout user
};

describe("overlap", () => {
  it("detects half-open overlap", () => {
    expect(rangesOverlap(stayRange("2026-09-01", "2026-09-05"), stayRange("2026-09-04", "2026-09-06"))).toBe(true);
  });
  it("treats checkout day == next checkin as NOT overlapping", () => {
    expect(rangesOverlap(stayRange("2026-09-01", "2026-09-05"), stayRange("2026-09-05", "2026-09-08"))).toBe(false);
  });
  it("counts nights", () => {
    expect(nightsBetween("2026-09-01", "2026-09-05")).toBe(4);
  });
});

describe("booking number", () => {
  it("formats ES-YYYYMMDD-NNNNNN", () => {
    expect(formatBookingNumber(1, AT)).toBe("ES-20260821-000001");
    expect(formatBookingNumber(123456, AT)).toBe("ES-20260821-123456");
    expect(isBookingNumber("ES-20260821-000001")).toBe(true);
    expect(isBookingNumber("XX-1-2")).toBe(false);
  });
});

describe("buildBookingDraft — property", () => {
  const draft = buildBookingDraft(
    { kind: "property", guest: { id: "usr_guest_001" }, property: activeProperty, checkIn: "2026-09-01", checkOut: "2026-09-03", guestsCount: 2 },
    AT,
  );
  it("computes base + 18% GST into the guest total", () => {
    expect(draft.originalPricePaise).toBe(4900000); // ₹24,500 × 2 nights
    expect(draft.gstRateBps).toBe(1800);
    expect(draft.expectedGuestTotalPaise).toBe(4900000 + 882000);
  });
  it("captures policy / commission / tax snapshots", () => {
    expect(draft.cancellationPolicyType).toBe("strict");
    expect(draft.cancellationPolicySnapshot.version).toBe(1);
    expect(draft.commissionBps).toBe(1500);
    expect(draft.taxSnapshot.category).toBe("accommodation");
  });
  it("sets the hold window to [check_in, check_out)", () => {
    expect(draft.holdStart.toISOString()).toBe("2026-09-01T00:00:00.000Z");
    expect(draft.holdEnd.toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });
});

describe("buildBookingDraft — host safety", () => {
  it("routes an Earthy-owned property to the internal entity", () => {
    const draft = buildBookingDraft(
      { kind: "property", guest: { id: "g" }, property: earthyOwnedProperty, checkIn: "2026-09-01", checkOut: "2026-09-02", guestsCount: 1 },
      AT,
    );
    expect(draft.hostId).toBe(INTERNAL_EARTHY_USER_ID);
    expect(draft.isInternalInventory).toBe(true);
    // ₹10,000 ≤ ₹7,500? no → but wait 10000>7500 → 18%
    expect(draft.gstRateBps).toBe(1800);
  });
  it("defaults a legacy null property policy to moderate", () => {
    const draft = buildBookingDraft(
      { kind: "property", guest: { id: "g" }, property: earthyOwnedProperty, checkIn: "2026-09-01", checkOut: "2026-09-02", guestsCount: 1 },
      AT,
    );
    expect(draft.cancellationPolicyType).toBe("moderate");
  });
  it("rejects an experience whose persona is not mapped to a payout user", () => {
    expect(() =>
      buildBookingDraft(
        { kind: "experience", guest: { id: "g" }, experience: unmappedExperience, experienceDate: new Date("2026-09-10T09:00:00Z"), guestsCount: 2 },
        AT,
      ),
    ).toThrowError(BookingError);
    try {
      buildBookingDraft({ kind: "experience", guest: { id: "g" }, experience: unmappedExperience, experienceDate: new Date("2026-09-10T09:00:00Z"), guestsCount: 2 }, AT);
    } catch (e) {
      expect((e as BookingError).code).toBe("HOST_FINANCIAL_ACCOUNT_NOT_READY");
    }
  });
  it("allows a mapped experience and uses its payout host", () => {
    const draft = buildBookingDraft(
      { kind: "experience", guest: { id: "g" }, experience: mappedExperience, experienceDate: new Date("2026-09-10T09:00:00Z"), guestsCount: 2 },
      AT,
    );
    expect(draft.hostId).toBe("usr_realhost_x");
    expect(draft.originalPricePaise).toBe(500000); // ₹2,500 × 2
    expect(draft.taxSnapshot.pendingCaConfirmation).toBe(true);
  });
});

describe("buildBookingDraft — validation", () => {
  it("enforces INR only", () => {
    expect(() =>
      buildBookingDraft({ kind: "property", guest: { id: "g" }, property: activeProperty, checkIn: "2026-09-01", checkOut: "2026-09-02", guestsCount: 1, currency: "USD" }, AT),
    ).toThrowError(/INR/);
  });
  it("rejects invalid dates", () => {
    expect(() =>
      buildBookingDraft({ kind: "property", guest: { id: "g" }, property: activeProperty, checkIn: "2026-09-05", checkOut: "2026-09-01", guestsCount: 1 }, AT),
    ).toThrow();
  });
  it("rejects a non-active listing", () => {
    expect(() =>
      buildBookingDraft({ kind: "property", guest: { id: "g" }, property: { ...activeProperty, status: "paused" }, checkIn: "2026-09-01", checkOut: "2026-09-02", guestsCount: 1 }, AT),
    ).toThrow();
  });
});

describe("MockPaymentProvider", () => {
  it("succeeds, fails, and is idempotent on duplicate verify", async () => {
    const p = new MockPaymentProvider();
    const intent = await p.createPaymentIntent({ bookingId: "b1", amountPaise: 100, currency: "INR" });
    const first = await p.verifyPayment({ intentId: intent.intentId, token: "success" });
    expect(first.succeeded).toBe(true);
    expect(first.duplicate).toBe(false);
    const second = await p.verifyPayment({ intentId: intent.intentId, token: "failure" });
    expect(second.succeeded).toBe(true); // same outcome as first
    expect(second.duplicate).toBe(true);
  });
  it("records a failure", async () => {
    const p = new MockPaymentProvider();
    const intent = await p.createPaymentIntent({ bookingId: "b2", amountPaise: 100, currency: "INR" });
    const v = await p.verifyPayment({ intentId: intent.intentId, token: "failure" });
    expect(v.succeeded).toBe(false);
    expect(v.failureReason).toBe("declined");
  });
  it("supports a delayed callback", async () => {
    const p = new MockPaymentProvider();
    const intent = await p.createPaymentIntent({ bookingId: "b3", amountPaise: 100, currency: "INR" });
    const v = await p.verifyPayment({ intentId: intent.intentId, token: "delayed:1" });
    expect(v.succeeded).toBe(true);
  });
});
