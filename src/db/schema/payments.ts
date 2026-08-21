/**
 * payments + payment_attempts + gateway_webhook_events + payment_discrepancies.
 * Phase 1B.5 Phase D.
 *
 * Model:
 *   • payments — the ONE payment OBLIGATION per booking (V1: 100% up front,
 *     kind=full), created UNPAID with the Booking. Retry attempts do NOT live
 *     here. Status uses the shared payment_status vocabulary (UNPAID/PROCESSING/
 *     PAID/FAILED/REFUND_PENDING/PARTIALLY_REFUNDED/REFUNDED).
 *   • payment_attempts — each gateway try (CREATED/PROCESSING/SUCCEEDED/FAILED/
 *     CANCELLED). Many per payment. Holds all gateway-specific data.
 *   • gateway_webhook_events — idempotency ledger: a processed webhook is a
 *     provable no-op on replay, keyed unique on (gateway, event_id).
 *   • payment_discrepancies — wrong-amount / under / over / currency mismatches
 *     recorded for ADMIN review; such events never confirm a booking.
 *
 * Idempotency (spec §8) is DB-enforced via the UNIQUE constraints below.
 * NO real money, NO ledger posting, NO refunds/payouts here.
 */
import {
  bigint,
  boolean,
  char,
  index,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt, uuidDefault } from "./_shared";
import { bookings } from "./bookings";
import {
  discrepancyType,
  paymentAttemptStatus,
  paymentKind,
  paymentStatus,
} from "./enums";

/* ── payments — the obligation ─────────────────────────────────────────── */
export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().default(uuidDefault),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),

    kind: paymentKind("kind").notNull().default("full"),
    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("INR"),

    status: paymentStatus("status").notNull().default("UNPAID"),

    provider: text("provider"), // set when a gateway attempt begins
    /** Successful capture reference (gateway payment id). */
    gatewayPaymentId: text("gateway_payment_id"),
    /** Gateway fee Earthy absorbed on capture, in paise. Never reduces payout. */
    gatewayFeePaise: bigint("gateway_fee_paise", { mode: "number" }).notNull().default(0),
    /** The attempt that settled this payment. */
    succeededAttemptId: uuid("succeeded_attempt_id"),

    /** Payment-level idempotency key (obligation identity). */
    idempotencyKey: text("idempotency_key").notNull(),

    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("payments_booking_uq").on(t.bookingId), // one obligation per booking
    uniqueIndex("payments_idem_uq").on(t.idempotencyKey),
    index("payments_status_idx").on(t.status),
  ],
);

/* ── payment_attempts — each gateway try ───────────────────────────────── */
export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuid("id").primaryKey().default(uuidDefault),
    paymentId: uuid("payment_id")
      .notNull()
      .references(() => payments.id),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),

    attemptNo: smallint("attempt_no").notNull(),

    provider: text("provider").notNull(), // "mock" in Phase D
    gatewayOrderId: text("gateway_order_id"),
    gatewayPaymentId: text("gateway_payment_id"),

    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("INR"),
    gatewayFeePaise: bigint("gateway_fee_paise", { mode: "number" }).notNull().default(0),

    status: paymentAttemptStatus("status").notNull().default("CREATED"),
    failureCode: text("failure_code"),
    failureMessage: text("failure_message"),

    /** Client-generated per attempt — unique, blocks duplicate charge starts. */
    idempotencyKey: text("idempotency_key").notNull(),
    /** Correlation / request reference id. */
    requestId: text("request_id"),

    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    index("payment_attempts_payment_idx").on(t.paymentId),
    index("payment_attempts_booking_idx").on(t.bookingId),
    index("payment_attempts_status_idx").on(t.status),
    uniqueIndex("payment_attempts_idem_uq").on(t.idempotencyKey),
    // A gateway capture id can back at most one attempt (webhook idempotency).
    uniqueIndex("payment_attempts_gateway_payment_uq").on(t.gatewayPaymentId),
    uniqueIndex("payment_attempts_payment_attemptno_uq").on(t.paymentId, t.attemptNo),
  ],
);

/* ── gateway_webhook_events — idempotency ledger ───────────────────────── */
export const gatewayWebhookEvents = pgTable(
  "gateway_webhook_events",
  {
    id: uuid("id").primaryKey().default(uuidDefault),
    gateway: text("gateway").notNull(),
    /** Provider event id (or deterministic hash) — the dedupe key. */
    eventId: text("event_id").notNull(),
    eventType: text("event_type"),
    bookingId: uuid("booking_id").references(() => bookings.id),
    paymentAttemptId: uuid("payment_attempt_id").references(() => paymentAttempts.id),
    payload: jsonb("payload"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("gateway_webhook_events_uq").on(t.gateway, t.eventId),
    index("gateway_webhook_events_booking_idx").on(t.bookingId),
  ],
);

/* ── payment_discrepancies — admin-visible mismatches ──────────────────── */
export const paymentDiscrepancies = pgTable(
  "payment_discrepancies",
  {
    id: uuid("id").primaryKey().default(uuidDefault),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),
    paymentId: uuid("payment_id").references(() => payments.id),
    paymentAttemptId: uuid("payment_attempt_id").references(() => paymentAttempts.id),

    type: discrepancyType("type").notNull(),
    expectedAmountPaise: bigint("expected_amount_paise", { mode: "number" }).notNull(),
    providerAmountPaise: bigint("provider_amount_paise", { mode: "number" }).notNull(),
    expectedCurrency: char("expected_currency", { length: 3 }).notNull(),
    providerCurrency: char("provider_currency", { length: 3 }).notNull(),

    gatewayPaymentId: text("gateway_payment_id"),
    note: text("note"),
    resolved: boolean("resolved").notNull().default(false),
    createdAt,
  },
  (t) => [
    index("payment_discrepancies_booking_idx").on(t.bookingId),
    index("payment_discrepancies_resolved_idx").on(t.resolved),
  ],
);

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
export type PaymentAttemptRow = typeof paymentAttempts.$inferSelect;
export type NewPaymentAttemptRow = typeof paymentAttempts.$inferInsert;
export type GatewayWebhookEventRow = typeof gatewayWebhookEvents.$inferSelect;
export type PaymentDiscrepancyRow = typeof paymentDiscrepancies.$inferSelect;
