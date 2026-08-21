/**
 * Payment + PaymentAttempt INTEGRATION tests — Phase 1B.5 Phase D.
 * Skipped until DATABASE_URL is set. Covers spec §18 scenarios.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../../db/client";
import * as schema from "../../db/schema";
import { createBooking, startPayment, verifyPayment, type BookingDeps } from "../booking/service";
import { MockPaymentProvider } from "./mock-provider";

const HAS_DB = !!process.env.DATABASE_URL;
const GUEST = "usr_pi_guest";
const HOST = "usr_pi_host";
const PROP = "pi-villa";

describe.skipIf(!HAS_DB)("payments (integration)", () => {
  let db: ReturnType<typeof getDb>;
  let deps: BookingDeps;
  const provider = new MockPaymentProvider();

  async function seed() {
    await db.insert(schema.users).values([
      { id: GUEST, email: "pi-guest@example.com", fullName: "PI Guest", role: "guest" },
      { id: HOST, email: "pi-host@example.com", fullName: "PI Host", role: "host", isHost: true },
    ]).onConflictDoNothing();
    await db.insert(schema.properties).values({ slug: PROP, hostId: HOST, name: "PI Villa", type: "villa", baseNightlyPricePaise: 500000, cancellationPolicy: "moderate", status: "active", raw: {} }).onConflictDoNothing();
  }
  async function clear() {
    const rows = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.propertyId, PROP));
    for (const { id } of rows) {
      await db.delete(schema.paymentDiscrepancies).where(eq(schema.paymentDiscrepancies.bookingId, id));
      await db.delete(schema.gatewayWebhookEvents).where(eq(schema.gatewayWebhookEvents.bookingId, id));
      await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, id));
      await db.delete(schema.payments).where(eq(schema.payments.bookingId, id));
      await db.delete(schema.inventoryHolds).where(eq(schema.inventoryHolds.bookingId, id));
      await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
    }
  }
  beforeEach(async () => { db = getDb(); deps = { db, provider }; await seed(); await clear(); });
  afterAll(async () => { await clear(); await closeDb(); });

  const book = (ci: string, co: string) => createBooking(deps, { kind: "property", guestId: GUEST, propertyId: PROP, checkIn: ci, checkOut: co, guestsCount: 1 });
  const pay = (bookingId: string) => db.query.payments.findFirst({ where: eq(schema.payments.bookingId, bookingId) });
  const attempts = (bookingId: string) => db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, bookingId));

  it("1-3: creates one UNPAID INR payment obligation = 100% of the booking total", async () => {
    const r = await book("2028-01-01", "2028-01-02");
    const p = await pay(r.bookingId);
    expect(p?.status).toBe("UNPAID");
    expect(p?.currency).toBe("INR");
    expect(p?.amountPaise).toBe(r.expectedGuestTotalPaise);
    expect(await attempts(r.bookingId)).toHaveLength(0); // no attempt until startPayment
  });

  it("4-8,18: fail, retry, succeed → PAID, booking CONFIRMED, hold CONVERTED", async () => {
    const r = await book("2028-02-01", "2028-02-02");
    const s1 = await startPayment(deps, { bookingId: r.bookingId });
    const f = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s1.intentId, token: "failure" });
    expect(f.confirmed).toBe(false);
    const s2 = await startPayment(deps, { bookingId: r.bookingId }); // retry
    const ok = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s2.intentId, token: "success" });
    expect(ok.confirmed).toBe(true);

    const p = await pay(r.bookingId);
    expect(p?.status).toBe("PAID");
    const all = await attempts(r.bookingId);
    expect(all).toHaveLength(2);
    expect(all.filter((a) => a.status === "SUCCEEDED")).toHaveLength(1);
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, r.bookingId) });
    expect(booking?.bookingStatus).toBe("CONFIRMED");
    const hold = await db.query.inventoryHolds.findFirst({ where: eq(schema.inventoryHolds.bookingId, r.bookingId) });
    expect(hold?.status).toBe("converted");
  });

  it("9-10: duplicate success callback settles exactly once", async () => {
    const r = await book("2028-03-01", "2028-03-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    const dup = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    expect(dup.duplicate).toBe(true);
    const events = await db.select().from(schema.gatewayWebhookEvents).where(eq(schema.gatewayWebhookEvents.bookingId, r.bookingId));
    expect(events).toHaveLength(1);
    expect((await attempts(r.bookingId)).filter((a) => a.status === "SUCCEEDED")).toHaveLength(1);
  });

  it("11: wrong amount is rejected, recorded, booking not confirmed", async () => {
    const r = await book("2028-04-01", "2028-04-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    const res = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: `amount:${r.expectedGuestTotalPaise + 100000}` });
    expect(res.confirmed).toBe(false);
    expect(res.discrepancy).toBe(true);
    const disc = await db.select().from(schema.paymentDiscrepancies).where(eq(schema.paymentDiscrepancies.bookingId, r.bookingId));
    expect(disc).toHaveLength(1);
    expect(disc[0].type).toBe("OVERPAYMENT");
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, r.bookingId) });
    expect(booking?.bookingStatus).toBe("PENDING_PAYMENT");
  });

  it("12: underpayment is rejected", async () => {
    const r = await book("2028-05-01", "2028-05-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    const res = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: `amount:${r.expectedGuestTotalPaise - 100000}` });
    expect(res.discrepancy).toBe(true);
    const disc = await db.select().from(schema.paymentDiscrepancies).where(eq(schema.paymentDiscrepancies.bookingId, r.bookingId));
    expect(disc[0].type).toBe("UNDERPAYMENT");
  });

  it("13: delayed callback still confirms", async () => {
    const r = await book("2028-06-01", "2028-06-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    const res = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "delayed:1" });
    expect(res.confirmed).toBe(true);
  });

  it("14: duplicate idempotency key rejected at the database", async () => {
    const r = await book("2028-07-01", "2028-07-02");
    const p = await pay(r.bookingId);
    await db.insert(schema.paymentAttempts).values({ paymentId: p!.id, bookingId: r.bookingId, attemptNo: 91, provider: "mock", amountPaise: 1, idempotencyKey: "dup-key" });
    await expect(
      db.insert(schema.paymentAttempts).values({ paymentId: p!.id, bookingId: r.bookingId, attemptNo: 92, provider: "mock", amountPaise: 1, idempotencyKey: "dup-key" }),
    ).rejects.toBeTruthy();
  });

  it("15: cannot confirm a cancelled booking", async () => {
    const r = await book("2028-08-01", "2028-08-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    await db.update(schema.bookings).set({ bookingStatus: "CANCELLED" }).where(eq(schema.bookings.id, r.bookingId));
    const res = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    expect(res.confirmed).toBe(false);
    expect(res.reason).toBe("booking_CANCELLED");
  });

  it("16: cannot confirm an expired booking", async () => {
    const r = await book("2028-09-01", "2028-09-02");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    await db.update(schema.bookings).set({ bookingStatus: "EXPIRED" }).where(eq(schema.bookings.id, r.bookingId));
    const res = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    expect(res.confirmed).toBe(false);
    expect(res.reason).toBe("booking_EXPIRED");
  });

  it("17: cannot confirm the wrong booking (relationship mismatch)", async () => {
    const a = await book("2028-10-01", "2028-10-02");
    const b = await book("2028-10-05", "2028-10-06");
    const sa = await startPayment(deps, { bookingId: a.bookingId }); // intent belongs to A
    const res = await verifyPayment(deps, { bookingId: b.bookingId, intentId: sa.intentId, token: "success" });
    expect(res.confirmed).toBe(false);
    expect(res.discrepancy).toBe(true);
    const bookingB = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, b.bookingId) });
    expect(bookingB?.bookingStatus).toBe("PENDING_PAYMENT");
  });

  it("20: multiple attempts create only one payment obligation", async () => {
    const r = await book("2028-11-01", "2028-11-02");
    await startPayment(deps, { bookingId: r.bookingId });
    await startPayment(deps, { bookingId: r.bookingId });
    await startPayment(deps, { bookingId: r.bookingId });
    const payments = await db.select().from(schema.payments).where(eq(schema.payments.bookingId, r.bookingId));
    expect(payments).toHaveLength(1);
    expect(await attempts(r.bookingId)).toHaveLength(3);
  });
});
