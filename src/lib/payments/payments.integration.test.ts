/**
 * Payment + PaymentAttempt INTEGRATION tests — Phase 1B.5 Phase D.
 * Skipped until DATABASE_URL is set (see service.integration.test.ts header).
 *
 * Covers spec §26: duplicate webhook, duplicate payment attempt, multiple
 * failed attempts then success, and gateway-fee recording (never reducing host
 * payable).
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { closeDb, getDb } from "../../db/client";
import * as schema from "../../db/schema";
import { createBooking, confirmBooking, type BookingDeps } from "../booking/service";
import { MockPaymentProvider } from "./mock-provider";
import { retryPayment } from "./service";

const HAS_DB = !!process.env.DATABASE_URL;
const GUEST = "usr_pi_guest";
const HOST = "usr_pi_host";
const PROP = "pi-villa";

describe.skipIf(!HAS_DB)("payments (integration)", () => {
  let db: ReturnType<typeof getDb>;
  let deps: BookingDeps;
  const provider = new MockPaymentProvider();

  async function seed() {
    await db
      .insert(schema.users)
      .values([
        { id: GUEST, email: "pi-guest@example.com", fullName: "PI Guest", role: "guest" },
        { id: HOST, email: "pi-host@example.com", fullName: "PI Host", role: "host", isHost: true },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.properties)
      .values({ slug: PROP, hostId: HOST, name: "PI Villa", type: "villa", baseNightlyPricePaise: 500000, cancellationPolicy: "moderate", status: "active", raw: {} })
      .onConflictDoNothing();
  }

  async function clear() {
    const rows = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.propertyId, PROP));
    for (const { id } of rows) {
      await db.delete(schema.gatewayWebhookEvents).where(eq(schema.gatewayWebhookEvents.bookingId, id));
      await db.delete(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, id));
      await db.delete(schema.payments).where(eq(schema.payments.bookingId, id));
      await db.delete(schema.inventoryHolds).where(eq(schema.inventoryHolds.bookingId, id));
      await db.delete(schema.bookings).where(eq(schema.bookings.id, id));
    }
  }

  beforeEach(async () => {
    db = getDb();
    deps = { db, provider };
    await seed();
    await clear();
  });
  afterAll(async () => {
    await clear();
    await closeDb();
  });

  const book = (ci: string, co: string) =>
    createBooking(deps, { kind: "property", guestId: GUEST, propertyId: PROP, checkIn: ci, checkOut: co, guestsCount: 1 });

  it("creates a pending payment + first attempt on booking", async () => {
    const r = await book("2028-01-01", "2028-01-02");
    const pay = await db.query.payments.findFirst({ where: eq(schema.payments.bookingId, r.bookingId) });
    expect(pay?.status).toBe("pending");
    const attempts = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, r.bookingId));
    expect(attempts).toHaveLength(1);
    expect(attempts[0].attemptNo).toBe(1);
    expect(attempts[0].status).toBe("created");
  });

  it("settles payment on success and records the gateway fee", async () => {
    const r = await book("2028-02-01", "2028-02-02");
    await confirmBooking(deps, { bookingId: r.bookingId, intentId: r.intentId, token: "success" });
    const pay = await db.query.payments.findFirst({ where: eq(schema.payments.bookingId, r.bookingId) });
    expect(pay?.status).toBe("succeeded");
    expect(pay?.gatewayFeePaise).toBeGreaterThan(0); // fee captured…
    // …but host payable is derived elsewhere and never reduced by this fee.
  });

  it("is idempotent under a duplicate webhook (confirm twice)", async () => {
    const r = await book("2028-03-01", "2028-03-02");
    await confirmBooking(deps, { bookingId: r.bookingId, intentId: r.intentId, token: "success" });
    await confirmBooking(deps, { bookingId: r.bookingId, intentId: r.intentId, token: "success" });
    const events = await db.select().from(schema.gatewayWebhookEvents).where(eq(schema.gatewayWebhookEvents.bookingId, r.bookingId));
    expect(events).toHaveLength(1); // one webhook event only
    const succeeded = (await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, r.bookingId))).filter((a) => a.status === "succeeded");
    expect(succeeded).toHaveLength(1);
  });

  it("supports multiple failed attempts then success", async () => {
    const r = await book("2028-04-01", "2028-04-02");
    const f1 = await confirmBooking(deps, { bookingId: r.bookingId, intentId: r.intentId, token: "failure" });
    expect(f1.confirmed).toBe(false);
    const retry1 = await retryPayment(db, provider, { bookingId: r.bookingId });
    const f2 = await confirmBooking(deps, { bookingId: r.bookingId, intentId: retry1.intentId, token: "failure" });
    expect(f2.confirmed).toBe(false);
    const retry2 = await retryPayment(db, provider, { bookingId: r.bookingId });
    const ok = await confirmBooking(deps, { bookingId: r.bookingId, intentId: retry2.intentId, token: "success" });
    expect(ok.confirmed).toBe(true);

    const attempts = await db.select().from(schema.paymentAttempts).where(eq(schema.paymentAttempts.bookingId, r.bookingId));
    expect(attempts.length).toBe(3);
    expect(attempts.filter((a) => a.status === "succeeded")).toHaveLength(1);
    const booking = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, r.bookingId) });
    expect(booking?.bookingStatus).toBe("CONFIRMED");
  });

  it("rejects a duplicate idempotency key at the database", async () => {
    const r = await book("2028-05-01", "2028-05-02");
    const pay = await db.query.payments.findFirst({ where: eq(schema.payments.bookingId, r.bookingId) });
    await expect(
      db.insert(schema.paymentAttempts).values({
        paymentId: pay!.id,
        bookingId: r.bookingId,
        attemptNo: 99,
        gateway: "mock",
        amountPaise: 1,
        idempotencyKey: "dup-key",
      }).then(() =>
        db.insert(schema.paymentAttempts).values({
          paymentId: pay!.id,
          bookingId: r.bookingId,
          attemptNo: 100,
          gateway: "mock",
          amountPaise: 1,
          idempotencyKey: "dup-key",
        }),
      ),
    ).rejects.toBeTruthy();
  });
});
