/**
 * Booking service INTEGRATION tests — Phase 1B.5 Phase C.
 *
 * These require a real PostgreSQL with the migrations applied. They are SKIPPED
 * automatically when DATABASE_URL is unset, so the suite stays green before
 * Postgres is provisioned. To run:
 *
 *   createdb earthy_dev
 *   DATABASE_URL=postgres://localhost:5432/earthy_dev npm run db:migrate
 *   DATABASE_URL=postgres://localhost:5432/earthy_dev npm test
 *
 * Covers concurrency (exclusion constraint), hold expiration, confirmation
 * through the mock provider, duplicate callbacks, and inventory release.
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { closeDb, getDb } from "../../db/client";
import { INTERNAL_EARTHY_USER_ID } from "../../db/internal-entity";
import * as schema from "../../db/schema";
import { MemoryAuditSink } from "./audit";
import { MockPaymentProvider } from "../payments/mock-provider";
import { BookingError } from "./errors";
import { createBooking, startPayment, verifyPayment, expireHolds, type BookingDeps } from "./service";

const HAS_DB = !!process.env.DATABASE_URL;

const GUEST = "usr_it_guest";
const HOST = "usr_it_host";
const PROP = "it-villa";
const EXP = "it-experience";

describe.skipIf(!HAS_DB)("booking service (integration)", () => {
  // Initialised in beforeEach so a skipped suite never opens a DB connection
  // (the describe body is still evaluated during collection).
  let db: ReturnType<typeof getDb>;
  let deps: BookingDeps;
  const provider = new MockPaymentProvider();
  const audit = new MemoryAuditSink();

  async function seed() {
    await db
      .insert(schema.users)
      .values([
        { id: GUEST, email: "it-guest@example.com", fullName: "IT Guest", role: "guest" },
        { id: HOST, email: "it-host@example.com", fullName: "IT Host", role: "host", isHost: true },
        { id: INTERNAL_EARTHY_USER_ID, email: "internal@earthystays.com", fullName: "Earthy Internal", role: "internal", isInternal: true },
      ])
      .onConflictDoNothing();
    await db
      .insert(schema.properties)
      .values({ slug: PROP, hostId: HOST, name: "IT Villa", type: "villa", baseNightlyPricePaise: 500000, cancellationPolicy: "moderate", status: "active", raw: {} })
      .onConflictDoNothing();
    await db
      .insert(schema.experiences)
      .values({ slug: EXP, hostUserId: HOST, hostPersonaId: "host_it", name: "IT Exp", priceFromPaise: 200000, status: "active", raw: {} })
      .onConflictDoNothing();
  }

  async function clearBookings() {
    const rows = await db.select({ id: schema.bookings.id }).from(schema.bookings).where(inArray(schema.bookings.propertyId, [PROP]));
    const ids = rows.map((r) => r.id);
    if (ids.length) {
      await db.delete(schema.inventoryHolds).where(inArray(schema.inventoryHolds.bookingId, ids));
      await db.delete(schema.bookings).where(inArray(schema.bookings.id, ids));
    }
  }

  beforeEach(async () => {
    db = getDb();
    deps = { db, provider, audit };
    await seed();
    await clearBookings();
  });

  afterAll(async () => {
    await clearBookings();
    await closeDb();
  });

  const bookProp = (checkIn: string, checkOut: string) =>
    createBooking(deps, { kind: "property", guestId: GUEST, propertyId: PROP, checkIn, checkOut, guestsCount: 2 });

  it("creates a PENDING_PAYMENT booking with an active hold and a unique number", async () => {
    const a = await bookProp("2027-01-01", "2027-01-03");
    const b = await bookProp("2027-02-01", "2027-02-03");
    expect(a.bookingNumber).not.toBe(b.bookingNumber);
    const row = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, a.bookingId) });
    expect(row?.bookingStatus).toBe("PENDING_PAYMENT");
    const hold = await db.query.inventoryHolds.findFirst({ where: eq(schema.inventoryHolds.bookingId, a.bookingId) });
    expect(hold?.status).toBe("active");
  });

  it("confirms through the mock provider and converts the hold", async () => {
    const r = await bookProp("2027-03-01", "2027-03-03");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    const c = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    expect(c.confirmed).toBe(true);
    const row = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, r.bookingId) });
    expect(row?.bookingStatus).toBe("CONFIRMED");
    expect(row?.paymentStatus).toBe("PAID");
    const hold = await db.query.inventoryHolds.findFirst({ where: eq(schema.inventoryHolds.bookingId, r.bookingId) });
    expect(hold?.status).toBe("converted");
  });

  it("does not confirm on payment failure", async () => {
    const r = await bookProp("2027-04-01", "2027-04-03");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    const c = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "failure" });
    expect(c.confirmed).toBe(false);
    const row = await db.query.bookings.findFirst({ where: eq(schema.bookings.id, r.bookingId) });
    expect(row?.bookingStatus).toBe("PENDING_PAYMENT");
    expect(row?.paymentStatus).toBe("FAILED");
  });

  it("is idempotent on duplicate confirmation callbacks", async () => {
    const r = await bookProp("2027-05-01", "2027-05-03");
    const s = await startPayment(deps, { bookingId: r.bookingId });
    await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    const dup = await verifyPayment(deps, { bookingId: r.bookingId, intentId: s.intentId, token: "success" });
    expect(dup.confirmed).toBe(true);
    expect(dup.duplicate).toBe(true);
    const holds = await db.select().from(schema.inventoryHolds).where(eq(schema.inventoryHolds.bookingId, r.bookingId));
    expect(holds.filter((h) => h.status === "converted")).toHaveLength(1);
  });

  it("blocks two overlapping property holds (concurrency)", async () => {
    const results = await Promise.allSettled([bookProp("2027-06-01", "2027-06-05"), bookProp("2027-06-03", "2027-06-06")]);
    const ok = results.filter((r) => r.status === "fulfilled");
    const failed = results.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    expect(ok).toHaveLength(1);
    expect(failed).toHaveLength(1);
    expect((failed[0].reason as BookingError).code).toBe("INVENTORY_UNAVAILABLE");
  });

  it("allows non-overlapping dates simultaneously", async () => {
    const results = await Promise.allSettled([bookProp("2027-07-01", "2027-07-03"), bookProp("2027-07-03", "2027-07-06")]);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
  });

  it("lets an expired hold free the inventory for a new booking", async () => {
    // Book with a clock in the past so the hold is already expired.
    const past: BookingDeps = { ...deps, now: () => new Date("2020-01-01T00:00:00Z") };
    await createBooking(past, { kind: "property", guestId: GUEST, propertyId: PROP, checkIn: "2027-08-01", checkOut: "2027-08-03", guestsCount: 1 });
    const expired = await expireHolds(deps);
    expect(expired.expiredHolds).toBeGreaterThanOrEqual(1);
    // Same dates now bookable again.
    const again = await bookProp("2027-08-01", "2027-08-03");
    expect(again.bookingId).toBeTruthy();
  });

  it("rejects unknown property and unknown guest", async () => {
    await expect(createBooking(deps, { kind: "property", guestId: GUEST, propertyId: "nope", checkIn: "2027-09-01", checkOut: "2027-09-02", guestsCount: 1 })).rejects.toMatchObject({ code: "PROPERTY_NOT_FOUND" });
    await expect(createBooking(deps, { kind: "property", guestId: "ghost", propertyId: PROP, checkIn: "2027-09-01", checkOut: "2027-09-02", guestsCount: 1 })).rejects.toMatchObject({ code: "GUEST_NOT_FOUND" });
  });
});
