/**
 * payments + payment_attempts + gateway_webhook_events. Phase 1B.5 Phase D.
 *
 * Model:
 *   • payments — the ONE payment OBLIGATION per booking (V1: 100% up front,
 *     kind = full). It is the logical financial record; its status reflects
 *     settlement. Exactly one per booking (unique).
 *   • payment_attempts — each gateway try. Many per payment. Carries all
 *     gateway-specific data so the core model stays provider-agnostic.
 *   • gateway_webhook_events — an idempotency ledger: every processed webhook
 *     is recorded by (gateway, event_id) so replays are provable no-ops.
 *
 * Idempotency (spec §9) is enforced by UNIQUE constraints:
 *   • payment_attempts.idempotency_key       (one attempt per client key)
 *   • payment_attempts.gateway_payment_id     (a capture id can appear once)
 *   • gateway_webhook_events (gateway,event_id)  (a webhook processed once)
 *
 * NO real money and NO ledger posting here (Phase G+). Gateway fees are captured
 * for accounting but never reduce host payable.
 */
import {
  bigint,
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
  paymentAttemptStatus,
  paymentKind,
  paymentRecordStatus,
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

    status: paymentRecordStatus("status").notNull().default("pending"),

    /** The attempt that settled this payment (set on success). */
    succeededAttemptId: uuid("succeeded_attempt_id"),
    /** Total gateway fee Earthy absorbed for the successful capture, in paise. */
    gatewayFeePaise: bigint("gateway_fee_paise", { mode: "number" }).notNull().default(0),

    capturedAt: timestamp("captured_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    // V1: one payment obligation per booking.
    uniqueIndex("payments_booking_uq").on(t.bookingId),
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

    gateway: text("gateway").notNull(), // "mock" in Phase D
    gatewayOrderId: text("gateway_order_id"),
    gatewayPaymentId: text("gateway_payment_id"),

    amountPaise: bigint("amount_paise", { mode: "number" }).notNull(),
    currency: char("currency", { length: 3 }).notNull().default("INR"),
    gatewayFeePaise: bigint("gateway_fee_paise", { mode: "number" }).notNull().default(0),

    status: paymentAttemptStatus("status").notNull().default("created"),
    failureReason: text("failure_reason"),

    /** Client-generated per attempt — unique, blocks duplicate charge starts. */
    idempotencyKey: text("idempotency_key").notNull(),

    capturedAt: timestamp("captured_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
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
    /** Provider event id (or a deterministic hash) — the dedupe key. */
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

export type PaymentRow = typeof payments.$inferSelect;
export type NewPaymentRow = typeof payments.$inferInsert;
export type PaymentAttemptRow = typeof paymentAttempts.$inferSelect;
export type NewPaymentAttemptRow = typeof paymentAttempts.$inferInsert;
export type GatewayWebhookEventRow = typeof gatewayWebhookEvents.$inferSelect;
