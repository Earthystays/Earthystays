import { describe, expect, it } from "vitest";
import { resolveCommissionBps } from "@/lib/finance/commission";
import {
  bpsToPercent,
  computeEconomics,
  monthlyRevenue,
  summarisePayouts,
} from "./economics";
import { buildOpportunities } from "./opportunities";
import {
  getPropertyPerformance,
  summarisePerformance,
  type PropertyPerformance,
} from "./property-performance";
import type { HostBooking, HostData } from "@/lib/host-metrics";
import type { Villa } from "@/lib/types";

function villa(over: Partial<Villa> = {}): Villa {
  return {
    slug: "casa",
    name: "Casa Earthy",
    tagline: "t",
    description: "d".repeat(300),
    destinationSlug: "goa",
    collections: [],
    bedrooms: 3,
    maxGuests: 6,
    bathrooms: 3,
    pricePerNight: 10_000,
    rating: 4.8,
    reviewCount: 12,
    amenities: ["Pool", "Wifi", "AC", "Kitchen", "Parking"],
    highlights: ["Private pool"],
    images: Array.from({ length: 10 }, (_, i) => ({ src: `/${i}.jpg`, alt: `p${i}` })),
    houseRules: [],
    locationNote: "note",
    ...over,
  } as Villa;
}

function booking(over: Partial<HostBooking> = {}): HostBooking {
  const v = over.villa ?? villa();
  const checkIn = over.checkIn ?? new Date(2026, 7, 10);
  const checkOut = over.checkOut ?? new Date(2026, 7, 14);
  const nights = Math.round((checkOut.getTime() - checkIn.getTime()) / 864e5);
  return {
    inquiry: { id: "q1", villa: v.slug, guests: 4 } as HostBooking["inquiry"],
    villa: v,
    checkIn,
    checkOut,
    nights,
    amount: nights * v.pricePerNight,
    ...over,
  };
}

function hostData(over: Partial<HostData> = {}): HostData {
  return {
    listings: [villa()],
    requests: [],
    pending: [],
    bookings: [],
    threads: [],
    unreadMessages: 0,
    blockedBySlug: { casa: [] },
    ...over,
  };
}

describe("economics", () => {
  it("splits revenue using the finance module's rate, not a literal", () => {
    const bps = resolveCommissionBps("property");
    const b = booking(); // 4 nights × 10,000 = 40,000
    const { rows, totals } = computeEconomics(hostData(), [b]);

    expect(rows[0].grossRevenue).toBe(40_000);
    expect(rows[0].commissionBps).toBe(bps);
    expect(rows[0].commission).toBe(Math.round((40_000 * bps) / 10_000));
    expect(rows[0].ownerPayout).toBe(40_000 - rows[0].commission);
    // The split must always reconcile.
    expect(totals.commission + totals.ownerPayout).toBe(totals.grossRevenue);
  });

  it("converts basis points to a percentage", () => {
    expect(bpsToPercent(1500)).toBe(15);
    expect(bpsToPercent(1250)).toBe(12.5);
  });

  it("reports zeroes rather than dividing by nothing when there are no stays", () => {
    const { totals } = computeEconomics(hostData(), []);
    expect(totals).toMatchObject({ grossRevenue: 0, commission: 0, ownerPayout: 0, stays: 0 });
  });

  it("buckets monthly revenue by checkout month, oldest first", () => {
    const now = new Date(2026, 7, 20); // Aug 2026
    const rows = monthlyRevenue(
      [
        booking({ checkIn: new Date(2026, 6, 1), checkOut: new Date(2026, 6, 3) }),
        booking({ checkIn: new Date(2026, 7, 10), checkOut: new Date(2026, 7, 14) }),
      ],
      3,
      now,
    );
    expect(rows.map((r) => r.label)).toEqual(["Jun", "Jul", "Aug"]);
    expect(rows[0].grossRevenue).toBe(0);
    expect(rows[1].grossRevenue).toBe(20_000);
    expect(rows[2].grossRevenue).toBe(40_000);
  });

  it("nulls payout states the ledger owns instead of showing zero", () => {
    const s = summarisePayouts([booking()], new Date(2026, 7, 20));
    expect(s.processing).toBeNull();
    expect(s.paid).toBeNull();
    expect(s.failed).toBeNull();
    // Checked out before "now" → awaiting settlement, net of commission.
    expect(s.awaitingSettlement).toBeGreaterThan(0);
    expect(s.upcoming).toBe(0);
  });
});

describe("performance summary", () => {
  const row = (over: Partial<PropertyPerformance> = {}): PropertyPerformance => ({
    slug: "a", name: "A", views: 100, inquiries: 5, recentInquiries: 5, bookings: 2,
    revenue: 40_000, bookedNights: 4, adr: 10_000, occupancy: 50,
    rating: 4.5, reviewCount: 10, conversion: 5, ...over,
  });

  it("computes ADR from totals, not by averaging ADRs", () => {
    const s = summarisePerformance([
      row({ revenue: 40_000, bookedNights: 4 }),
      row({ slug: "b", revenue: 30_000, bookedNights: 10 }),
    ]);
    expect(s.revenue).toBe(70_000);
    expect(s.bookedNights).toBe(14);
    expect(s.adr).toBe(5_000); // 70,000 / 14 — not (10,000 + 3,000) / 2
  });

  it("returns null ADR and rating when there is nothing to average", () => {
    const s = summarisePerformance([
      row({ revenue: 0, bookedNights: 0, adr: null, rating: null }),
    ]);
    expect(s.adr).toBeNull();
    expect(s.rating).toBeNull();
  });
});

describe("conversion windowing", () => {
  it("never reports a conversion above 100% (all-time inquiries vs 30-day views)", () => {
    const now = new Date(2026, 7, 20);
    const old = new Date(2026, 0, 1).toISOString(); // far outside the window
    const recent = new Date(2026, 7, 18).toISOString();
    const data = hostData({
      requests: [
        { id: "1", villa: "casa", createdAt: old },
        { id: "2", villa: "casa", createdAt: old },
        { id: "3", villa: "casa", createdAt: old },
        { id: "4", villa: "casa", createdAt: recent },
      ] as unknown as HostData["requests"],
    });
    const [row] = getPropertyPerformance(data, { casa: 2 }, 7, 2026, now);

    expect(row.inquiries).toBe(4); // all-time, unchanged
    expect(row.recentInquiries).toBe(1); // only the in-window one
    expect(row.conversion).toBe(50); // 1 / 2 — not 200%
    expect(row.conversion!).toBeLessThanOrEqual(100);
  });
});

describe("opportunities", () => {
  const perf = (over: Partial<PropertyPerformance> = {}): PropertyPerformance => ({
    slug: "casa", name: "Casa Earthy", views: 0, inquiries: 0, recentInquiries: 0, bookings: 0,
    revenue: 0, bookedNights: 0, adr: null, occupancy: 0,
    rating: null, reviewCount: 0, conversion: null, ...over,
  });

  it("is empty when there is nothing real to say", () => {
    // Fully blocked calendar → no open-nights nudge; complete listing; no pending.
    const days = Array.from({ length: 40 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    });
    const data = hostData({ blockedBySlug: { casa: days } });
    expect(buildOpportunities(data, [perf()])).toEqual([]);
  });

  it("puts waiting guests first", () => {
    const data = hostData({
      pending: [{ id: "q" } as HostData["pending"][number]],
      unreadMessages: 2,
    });
    const ops = buildOpportunities(data, [perf()]);
    expect(ops[0].id).toBe("pending-requests");
    expect(ops[1].id).toBe("unread-messages");
  });

  it("flags high views with low inquiries, quoting the real numbers", () => {
    const ops = buildOpportunities(
      hostData(),
      [perf({ views: 500, inquiries: 1, recentInquiries: 1, conversion: 0 })],
    );
    const hit = ops.find((o) => o.id === "conversion-casa");
    expect(hit).toBeDefined();
    expect(hit!.detail).toContain("500 views");
    expect(hit!.detail).toContain("1 inquiry");
  });

  it("does not judge conversion on a small sample", () => {
    const ops = buildOpportunities(
      hostData(),
      [perf({ views: 10, inquiries: 0, recentInquiries: 0, conversion: 0 })],
    );
    expect(ops.find((o) => o.id === "conversion-casa")).toBeUndefined();
  });

  it("names the specific content gap rather than saying 'improve photos'", () => {
    const thin = villa({ images: [{ src: "/1.jpg", alt: "a" }], highlights: [] });
    const ops = buildOpportunities(hostData({ listings: [thin] }), [perf()]);
    const hit = ops.find((o) => o.id === "content-casa");
    expect(hit!.detail).toContain("only 1 photos");
    expect(hit!.detail).toContain("no highlights");
  });

  it("never promises revenue it cannot compute", () => {
    const ops = buildOpportunities(
      hostData({ pending: [{ id: "q" } as HostData["pending"][number]] }),
      [perf({ views: 500, inquiries: 1, recentInquiries: 1, conversion: 0 })],
    );
    for (const o of ops) {
      expect(`${o.title} ${o.detail}`).not.toMatch(/₹|could earn|estimated revenue|projected/i);
    }
  });
});
