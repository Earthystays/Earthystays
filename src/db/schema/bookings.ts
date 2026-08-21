/**
 * bookings — the real commercial booking (Phase 1B.5 Phase C).
 *
 * Separate from stored_inquiries (the lead record). Represents EITHER a property
 * stay OR an experience — enforced by a check constraint. The four state axes
 * are independent columns (booking / payment / payout / financial) — never a
 * single status.
 *
 * Snapshots (cancellation policy, commission, tax) are stored INLINE as
 * self-contained jsonb + queryable numeric columns. They are captured at
 * creation and MUST NOT change if the property's live policy/rules change
 * later. The CommissionRule / TaxRule tables arrive in Phase E; the nullable
 * `*_rule_id` columns are reserved for linking to them without altering the
 * immutable snapshot data.
 *
 * PK is an internal uuid. The human-readable `booking_number`
 * (ES-YYYYMMDD-NNNNNN) is a separate UNIQUE column, never the PK.
 *
 * NO financial capture happens here — money movement is later phases.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt, uuidDefault } from "./_shared";
import {
  actorKind,
  bookingKind,
  bookingStatus,
  cancellationPolicy,
  financialStatus,
  payoutStatus,
  paymentStatus,
} from "./enums";
import { experiences } from "./experiences";
import { properties } from "./properties";
import { storedInquiries } from "./stored-inquiries";
import { users } from "./users";

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().default(uuidDefault),
    /** Human ref ES-YYYYMMDD-NNNNNN. Unique, but NOT the primary key. */
    bookingNumber: text("booking_number").notNull(),

    /** Optional link to the originating lead. Legacy leads are never auto-linked. */
    inquiryId: text("inquiry_id").references(() => storedInquiries.id),

    kind: bookingKind("kind").notNull(),

    guestId: text("guest_id")
      .notNull()
      .references(() => users.id),
    /** Denormalized at creation — the payout host (may be the internal entity). */
    hostId: text("host_id")
      .notNull()
      .references(() => users.id),

    propertyId: text("property_id").references(() => properties.slug),
    experienceId: text("experience_id").references(() => experiences.slug),

    /** Property stays. */
    checkIn: date("check_in"),
    checkOut: date("check_out"),
    /** Experience bookings. */
    experienceDate: timestamp("experience_date", { withTimezone: true }),

    guestsCount: integer("guests_count").notNull().default(1),
    unitsCount: integer("units_count").notNull().default(1),

    currency: char("currency", { length: 3 }).notNull().default("INR"),

    /** Money in integer paise, GST-exclusive base and full guest total. */
    originalPricePaise: bigint("original_price_paise", { mode: "number" }).notNull(),
    expectedGuestTotalPaise: bigint("expected_guest_total_paise", {
      mode: "number",
    }).notNull(),

    /* ── Four independent state axes ─────────────────────────────────── */
    bookingStatus: bookingStatus("booking_status").notNull().default("PENDING_PAYMENT"),
    paymentStatus: paymentStatus("payment_status").notNull().default("UNPAID"),
    payoutStatus: payoutStatus("payout_status").notNull().default("NOT_ELIGIBLE"),
    financialStatus: financialStatus("financial_status").notNull().default("OPEN"),

    /* ── Immutable snapshots (captured at creation) ──────────────────── */
    /** Structured cancellation policy: type, tiers, thresholds, version, ts. */
    cancellationPolicyType: cancellationPolicy("cancellation_policy_type"),
    cancellationPolicySnapshot: jsonb("cancellation_policy_snapshot").notNull(),

    commissionBps: integer("commission_bps").notNull(),
    commissionRuleId: uuid("commission_rule_id"), // reserved for Phase E linkage
    commissionSnapshot: jsonb("commission_snapshot").notNull(),

    gstRateBps: integer("gst_rate_bps").notNull(),
    taxRuleId: uuid("tax_rule_id"), // reserved for Phase E linkage
    taxSnapshot: jsonb("tax_snapshot").notNull(),

    /* ── Lifecycle timestamps ────────────────────────────────────────── */
    /** Payment/hold deadline — mirrors the active inventory hold's expiresAt. */
    holdExpiresAt: timestamp("hold_expires_at", { withTimezone: true }),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
    checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledBy: actorKind("cancelled_by"),
    expiredAt: timestamp("expired_at", { withTimezone: true }),

    /** true once the booking targets Earthy-owned inventory (internal host). */
    isInternalInventory: boolean("is_internal_inventory").notNull().default(false),

    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("bookings_number_uq").on(t.bookingNumber),
    index("bookings_guest_idx").on(t.guestId),
    index("bookings_host_idx").on(t.hostId),
    index("bookings_property_idx").on(t.propertyId),
    index("bookings_experience_idx").on(t.experienceId),
    index("bookings_booking_status_idx").on(t.bookingStatus),
    index("bookings_payment_status_idx").on(t.paymentStatus),
    index("bookings_check_in_idx").on(t.checkIn),
    // Exactly one of property / experience, matching `kind`.
    check(
      "bookings_one_target_ck",
      sql`(
        (${t.kind} = 'property' AND ${t.propertyId} IS NOT NULL AND ${t.experienceId} IS NULL)
        OR
        (${t.kind} = 'experience' AND ${t.experienceId} IS NOT NULL AND ${t.propertyId} IS NULL)
      )`,
    ),
    // Property stays need a date range; experiences need a datetime.
    check(
      "bookings_dates_ck",
      sql`(
        (${t.kind} = 'property' AND ${t.checkIn} IS NOT NULL AND ${t.checkOut} IS NOT NULL AND ${t.checkOut} > ${t.checkIn})
        OR
        (${t.kind} = 'experience' AND ${t.experienceDate} IS NOT NULL)
      )`,
    ),
    // INR-only for V1.
    check("bookings_inr_only_ck", sql`${t.currency} = 'INR'`),
  ],
);

export type BookingRow = typeof bookings.$inferSelect;
export type NewBookingRow = typeof bookings.$inferInsert;
