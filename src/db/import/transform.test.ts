/**
 * Phase B migration transform tests — pure, no database required.
 * Covers spec §13: legacy ID preservation, duplicate detection, missing-host
 * detection, invalid records, no-financial-records guardrail, and idempotency
 * (determinism) of the transform.
 */
import { describe, expect, it } from "vitest";
import { INTERNAL_EARTHY_USER_ID, transformAll } from "./transform";

const users = [
  { id: "usr_testhost_001", email: "host@example.com", name: "Rahul", isHost: true, hostPhone: "+91 98220 00000", passwordHash: "h" },
  { id: "usr_guest_001", email: "guest@example.com", name: "Priya" },
];
const villas = [
  { slug: "oceanview-villa", name: "Oceanview", type: "villa", pricePerNight: 24500, cancellationPolicy: { preset: "strict" }, city: "Candolim", state: "Goa", destinationSlug: "candolim" },
  { slug: "azul-penthouse", name: "Azul", type: "apartment", pricePerNight: 10000 }, // no policy
];
const experiences = [
  { slug: "old-goa-food-walk", name: "Food Walk", priceFrom: 2500, currency: "INR", status: "published", hostId: "host_prateek", cancellationPolicy: "Free cancellation up to 24 hours." },
];
const inquiries = [
  { id: "inq_1", kind: "experience", name: "A", phone: "9", guests: 2, status: "open", experience: "old-goa-food-walk", createdAt: "2026-07-25T08:48:32.182Z", updatedAt: "2026-07-29T06:05:42.587Z" },
  { id: "inq_2", kind: "guest", name: "B", status: "booked", createdAt: "2026-07-01T00:00:00.000Z" },
];

describe("transformAll — happy path", () => {
  const out = transformAll({ users, villas, experiences, inquiries, mode: "dry-run" });

  it("preserves legacy text IDs", () => {
    expect(out.users.find((u) => u.id === "usr_testhost_001")).toBeTruthy();
    expect(out.properties[0].slug).toBe("oceanview-villa");
    expect(out.inquiries[0].id).toBe("inq_1");
  });

  it("converts prices to integer paise", () => {
    expect(out.properties[0].baseNightlyPricePaise).toBe(2450000); // ₹24,500
    expect(out.experiences[0].priceFromPaise).toBe(250000); // ₹2,500
  });

  it("maps a known cancellation preset and nulls an unknown/absent one", () => {
    expect(out.properties[0].cancellationPolicy).toBe("strict");
    expect(out.properties[1].cancellationPolicy).toBeNull();
  });

  it("creates a payment account for hosts and the internal entity, but not guests", () => {
    const userIds = out.paymentAccounts.map((p) => p.userId);
    expect(userIds).toContain("usr_testhost_001");
    expect(userIds).toContain(INTERNAL_EARTHY_USER_ID);
    expect(userIds).not.toContain("usr_guest_001");
  });

  it("seeds an internal Earthy entity for owned inventory", () => {
    const internal = out.users.find((u) => u.id === INTERNAL_EARTHY_USER_ID);
    expect(internal?.isInternal).toBe(true);
    expect(internal?.role).toBe("internal");
  });
});

describe("experience host separation (spec §22)", () => {
  const out = transformAll({ experiences, mode: "dry-run" });
  it("keeps the marketing persona but never assigns a payout user", () => {
    expect(out.experiences[0].hostPersonaId).toBe("host_prateek");
    expect(out.experiences[0].hostUserId).toBeNull();
  });
  it("flags every experience for manual host review", () => {
    expect(out.report.needsManualReview.some((r) => r.entity === "experience")).toBe(true);
  });
});

describe("no fake financial history (spec §11)", () => {
  const out = transformAll({ users, villas, experiences, inquiries, mode: "dry-run" });
  it("never creates financial records", () => {
    expect(out.report.financialRecordsCreated).toHaveLength(0);
    // transform output has no payments/refunds/payouts/ledger fields at all.
    expect(Object.keys(out)).toEqual(
      expect.arrayContaining(["users", "properties", "experiences", "inquiries", "paymentAccounts", "report"]),
    );
  });
  it('keeps a legacy "booked" inquiry as a lead with null bookingId', () => {
    const booked = out.inquiries.find((q) => q.id === "inq_2");
    expect(booked?.status).toBe("booked");
    expect(booked?.bookingId).toBeNull();
    expect(out.report.warnings.some((w) => w.id === "inq_2")).toBe(true);
  });
});

describe("validation", () => {
  it("detects duplicate IDs", () => {
    const out = transformAll({
      villas: [
        { slug: "dup", name: "One", type: "villa", pricePerNight: 1000 },
        { slug: "dup", name: "Two", type: "villa", pricePerNight: 2000 },
      ],
      seedInternalEntity: false,
      mode: "dry-run",
    });
    expect(out.report.duplicateIds.some((d) => d.id === "dup")).toBe(true);
    expect(out.properties.filter((p) => p.slug === "dup")).toHaveLength(1); // first kept
  });

  it("flags invalid records (missing required fields)", () => {
    const out = transformAll({
      users: [{ email: "no-id@example.com" }],
      villas: [{ name: "no slug" }],
      inquiries: [{ kind: "guest" }],
      seedInternalEntity: false,
      mode: "dry-run",
    });
    expect(out.report.invalidRecords.length).toBeGreaterThanOrEqual(3);
    expect(out.users).toHaveLength(0);
    expect(out.properties).toHaveLength(0);
    expect(out.inquiries).toHaveLength(0);
  });

  it("flags legacy villas as Earthy-owned (missing host relationship)", () => {
    const out = transformAll({ villas, seedInternalEntity: false, mode: "dry-run" });
    expect(out.report.missingRelationships.length).toBe(villas.length);
    expect(out.properties.every((p) => p.hostId === null)).toBe(true);
  });
});

describe("idempotency / determinism", () => {
  it("produces identical output on repeat transforms", () => {
    const a = transformAll({ users, villas, experiences, inquiries, mode: "dry-run" });
    const b = transformAll({ users, villas, experiences, inquiries, mode: "dry-run" });
    // Strip timestamps that legitimately differ.
    const strip = (o: ReturnType<typeof transformAll>) => ({
      users: o.users,
      properties: o.properties,
      experiences: o.experiences,
      inquiries: o.inquiries,
      paymentAccounts: o.paymentAccounts,
    });
    expect(strip(a)).toEqual(strip(b));
  });
});
