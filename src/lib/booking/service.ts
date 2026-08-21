/**
 * Booking service — DB-transactional lifecycle. Phase 1B.5 Phase C.
 *
 *   createBooking()   → inserts booking + 15-minute hold + mock payment intent
 *                       (one transaction). Booking is PENDING_PAYMENT.
 *   confirmBooking()  → verifies payment via the provider, then (one txn)
 *                       CONFIRMS booking + CONVERTS hold. Idempotent.
 *   expireHolds()     → EXPIREs due holds + their still-pending bookings.
 *                       Safe to run repeatedly.
 *
 * Concurrency: the 15-minute hold is inserted into inventory_holds, which has a
 * PostgreSQL GiST exclusion constraint over blocking (active/converted) PROPERTY
 * holds. Two overlapping attempts for the same property CANNOT both commit — the
 * loser hits a 23P01 exclusion violation, mapped to INVENTORY_UNAVAILABLE.
 *
 * NO money movement, NO ledger posting, NO payout here (later phases).
 */
import { and, eq, inArray, lte, sql } from "drizzle-orm";
import type { Database } from "../../db/client";
import * as schema from "../../db/schema";
import { HOLD_DURATION_MS } from "../../db/schema/inventory-holds";
import type { PaymentProvider } from "../payments/types";
import { type AuditSink, consoleAuditSink } from "./audit";
import { formatBookingNumber } from "./booking-number";
import { BookingError } from "./errors";
import {
  buildBookingDraft,
  type BookingInput,
  type ResolvedExperience,
  type ResolvedProperty,
} from "./quote";

export type BookingDeps = {
  db: Database;
  provider: PaymentProvider;
  audit?: AuditSink;
  now?: () => Date;
};

/** Postgres exclusion-violation SQLSTATE. */
const EXCLUSION_VIOLATION = "23P01";

type ServiceInput =
  | { kind: "property"; guestId: string; propertyId: string; checkIn: string; checkOut: string; guestsCount: number; unitsCount?: number; currency?: string; inquiryId?: string | null }
  | { kind: "experience"; guestId: string; experienceId: string; experienceDate: Date; guestsCount: number; currency?: string; inquiryId?: string | null };

export type CreateBookingResult = {
  bookingId: string;
  bookingNumber: string;
  holdId: string;
  intentId: string;
  expectedGuestTotalPaise: number;
  holdExpiresAt: Date;
};

export async function createBooking(
  deps: BookingDeps,
  input: ServiceInput,
): Promise<CreateBookingResult> {
  const now = deps.now?.() ?? new Date();
  const audit = deps.audit ?? consoleAuditSink;
  const { db } = deps;

  // Resolve entities (outside the txn — read-only).
  const guest = await db.query.users.findFirst({ where: eq(schema.users.id, input.guestId) });
  if (!guest) throw new BookingError("GUEST_NOT_FOUND", input.guestId);

  let draftInput: BookingInput;
  if (input.kind === "property") {
    const p = await db.query.properties.findFirst({ where: eq(schema.properties.slug, input.propertyId) });
    if (!p) throw new BookingError("PROPERTY_NOT_FOUND", input.propertyId);
    const property: ResolvedProperty = {
      slug: p.slug,
      status: p.status,
      hostId: p.hostId,
      baseNightlyPricePaise: p.baseNightlyPricePaise,
      cancellationPolicy: p.cancellationPolicy,
    };
    draftInput = { kind: "property", guest: { id: guest.id }, property, checkIn: input.checkIn, checkOut: input.checkOut, guestsCount: input.guestsCount, unitsCount: input.unitsCount, currency: input.currency };
  } else {
    const e = await db.query.experiences.findFirst({ where: eq(schema.experiences.slug, input.experienceId) });
    if (!e) throw new BookingError("EXPERIENCE_NOT_FOUND", input.experienceId);
    const experience: ResolvedExperience = {
      slug: e.slug,
      status: e.status,
      hostUserId: e.hostUserId,
      hostPersonaId: e.hostPersonaId,
      priceFromPaise: e.priceFromPaise,
    };
    draftInput = { kind: "experience", guest: { id: guest.id }, experience, experienceDate: input.experienceDate, guestsCount: input.guestsCount, currency: input.currency };
  }

  const draft = buildBookingDraft(draftInput, now);

  // Confirm the payout host exists (internal entity or real host).
  const host = await db.query.users.findFirst({ where: eq(schema.users.id, draft.hostId) });
  if (!host) throw new BookingError("HOST_NOT_FOUND", draft.hostId);

  const holdExpiresAt = new Date(now.getTime() + HOLD_DURATION_MS);

  try {
    return await db.transaction(async (tx) => {
      const [{ seq }] = (await tx.execute(
        sql`select nextval('booking_number_seq') as seq`,
      )) as unknown as Array<{ seq: number }>;
      const bookingNumber = formatBookingNumber(Number(seq), now);

      const [booking] = await tx
        .insert(schema.bookings)
        .values({
          bookingNumber,
          inquiryId: input.inquiryId ?? null,
          kind: draft.kind,
          guestId: draft.guestId,
          hostId: draft.hostId,
          propertyId: draft.propertyId,
          experienceId: draft.experienceId,
          checkIn: draft.checkIn,
          checkOut: draft.checkOut,
          experienceDate: draft.experienceDate,
          guestsCount: draft.guestsCount,
          unitsCount: draft.unitsCount,
          currency: draft.currency,
          originalPricePaise: draft.originalPricePaise,
          expectedGuestTotalPaise: draft.expectedGuestTotalPaise,
          bookingStatus: "PENDING_PAYMENT",
          paymentStatus: "UNPAID",
          payoutStatus: "NOT_ELIGIBLE",
          financialStatus: "OPEN",
          cancellationPolicyType: draft.cancellationPolicyType,
          cancellationPolicySnapshot: draft.cancellationPolicySnapshot,
          commissionBps: draft.commissionBps,
          commissionSnapshot: draft.commissionSnapshot,
          gstRateBps: draft.gstRateBps,
          taxSnapshot: draft.taxSnapshot,
          isInternalInventory: draft.isInternalInventory,
          holdExpiresAt,
        })
        .returning({ id: schema.bookings.id });

      const [hold] = await tx
        .insert(schema.inventoryHolds)
        .values({
          bookingId: booking.id,
          inventoryType: draft.kind,
          inventoryId: (draft.propertyId ?? draft.experienceId)!,
          startDate: draft.holdStart,
          endDate: draft.holdEnd,
          unitsCount: draft.unitsCount,
          expiresAt: holdExpiresAt,
          status: "active",
        })
        .returning({ id: schema.inventoryHolds.id });

      const intent = await deps.provider.createPaymentIntent({
        bookingId: booking.id,
        amountPaise: draft.expectedGuestTotalPaise,
        currency: "INR",
      });

      await audit.emit({ action: "booking.created", entity: "booking", entityId: booking.id, actorKind: "guest", actorId: draft.guestId, at: now.toISOString(), metadata: { bookingNumber } });
      await audit.emit({ action: "hold.created", entity: "inventory_hold", entityId: hold.id, actorKind: "system", at: now.toISOString(), metadata: { expiresAt: holdExpiresAt.toISOString() } });

      return {
        bookingId: booking.id,
        bookingNumber,
        holdId: hold.id,
        intentId: intent.intentId,
        expectedGuestTotalPaise: draft.expectedGuestTotalPaise,
        holdExpiresAt,
      };
    });
  } catch (err: unknown) {
    if (isExclusionViolation(err)) {
      throw new BookingError("INVENTORY_UNAVAILABLE", "those dates are no longer available");
    }
    throw err;
  }
}

export type ConfirmBookingResult = {
  bookingId: string;
  confirmed: boolean;
  duplicate: boolean;
  reason?: string;
};

export async function confirmBooking(
  deps: BookingDeps,
  input: { bookingId: string; intentId: string; token: string },
): Promise<ConfirmBookingResult> {
  const now = deps.now?.() ?? new Date();
  const audit = deps.audit ?? consoleAuditSink;
  const { db } = deps;

  const verification = await deps.provider.verifyPayment({ intentId: input.intentId, token: input.token });

  return db.transaction(async (tx) => {
    const booking = await tx.query.bookings.findFirst({ where: eq(schema.bookings.id, input.bookingId) });
    if (!booking) throw new BookingError("BOOKING_NOT_PENDING", input.bookingId);

    // Idempotent: already confirmed → no-op (safe under duplicate callbacks).
    if (booking.bookingStatus === "CONFIRMED") {
      return { bookingId: booking.id, confirmed: true, duplicate: true };
    }
    if (booking.bookingStatus !== "PENDING_PAYMENT") {
      throw new BookingError("BOOKING_NOT_PENDING", booking.bookingStatus);
    }

    if (!verification.succeeded) {
      await tx.update(schema.bookings).set({ paymentStatus: "FAILED", updatedAt: now }).where(eq(schema.bookings.id, booking.id));
      return { bookingId: booking.id, confirmed: false, duplicate: verification.duplicate, reason: verification.failureReason ?? "payment_failed" };
    }

    // Payment verified → confirm booking + convert its active hold.
    await tx.update(schema.bookings).set({ bookingStatus: "CONFIRMED", paymentStatus: "PAID", confirmedAt: now, updatedAt: now }).where(eq(schema.bookings.id, booking.id));

    const [hold] = await tx
      .update(schema.inventoryHolds)
      .set({ status: "converted", convertedAt: now })
      .where(and(eq(schema.inventoryHolds.bookingId, booking.id), eq(schema.inventoryHolds.status, "active")))
      .returning({ id: schema.inventoryHolds.id });

    await audit.emit({ action: "booking.confirmed", entity: "booking", entityId: booking.id, actorKind: "system", at: now.toISOString(), metadata: { gatewayPaymentId: verification.gatewayPaymentId } });
    if (hold) await audit.emit({ action: "hold.converted", entity: "inventory_hold", entityId: hold.id, actorKind: "system", at: now.toISOString() });

    return { bookingId: booking.id, confirmed: true, duplicate: verification.duplicate };
  });
}

export type ExpireHoldsResult = { expiredHolds: number; expiredBookings: number };

export async function expireHolds(deps: BookingDeps): Promise<ExpireHoldsResult> {
  const now = deps.now?.() ?? new Date();
  const audit = deps.audit ?? consoleAuditSink;
  const { db } = deps;

  return db.transaction(async (tx) => {
    const due = await tx
      .select({ id: schema.inventoryHolds.id, bookingId: schema.inventoryHolds.bookingId })
      .from(schema.inventoryHolds)
      .where(and(eq(schema.inventoryHolds.status, "active"), lte(schema.inventoryHolds.expiresAt, now)));

    if (due.length === 0) return { expiredHolds: 0, expiredBookings: 0 };

    const holdIds = due.map((h) => h.id);
    const bookingIds = due.map((h) => h.bookingId);

    await tx.update(schema.inventoryHolds).set({ status: "expired", expiredAt: now }).where(inArray(schema.inventoryHolds.id, holdIds));

    // Only still-pending bookings expire (idempotent; confirmed ones untouched).
    const expiredBookings = await tx
      .update(schema.bookings)
      .set({ bookingStatus: "EXPIRED", expiredAt: now, updatedAt: now })
      .where(and(inArray(schema.bookings.id, bookingIds), eq(schema.bookings.bookingStatus, "PENDING_PAYMENT")))
      .returning({ id: schema.bookings.id });

    for (const h of due) await audit.emit({ action: "hold.expired", entity: "inventory_hold", entityId: h.id, actorKind: "system", at: now.toISOString() });
    for (const b of expiredBookings) await audit.emit({ action: "booking.expired", entity: "booking", entityId: b.id, actorKind: "system", at: now.toISOString() });

    return { expiredHolds: holdIds.length, expiredBookings: expiredBookings.length };
  });
}

function isExclusionViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && "code" in err && (err as { code?: string }).code === EXCLUSION_VIOLATION;
}
