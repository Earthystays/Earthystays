/**
 * Payment persistence + idempotent verification. Phase 1B.5 Phase D.
 *
 * All functions operate on a transaction handle (Tx) so they compose inside the
 * booking service's transactions. NO real money, NO ledger posting.
 *
 * Idempotency is layered:
 *   1. gateway_webhook_events (gateway, event_id) — a processed webhook is a
 *      provable no-op on replay.
 *   2. payment_attempts.gateway_payment_id UNIQUE — a capture id settles once.
 *   3. payment_attempts.idempotency_key UNIQUE — a charge start happens once.
 * Together these guarantee duplicate webhooks/attempts never create duplicate
 * payments, revenue, commissions, host payables, or payouts.
 */
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import type { Database, Tx } from "../../db/client";
import * as schema from "../../db/schema";
import type { PaymentProvider, PaymentVerification } from "./types";

export type InitPaymentInput = {
  bookingId: string;
  amountPaise: number;
  gateway: string;
  gatewayOrderId: string | null;
};

export type InitPaymentResult = {
  paymentId: string;
  attemptId: string;
  attemptNo: number;
  idempotencyKey: string;
};

/** Create the single payment obligation + its first attempt (status created). */
export async function initPayment(tx: Tx, input: InitPaymentInput): Promise<InitPaymentResult> {
  const [payment] = await tx
    .insert(schema.payments)
    .values({
      bookingId: input.bookingId,
      kind: "full",
      amountPaise: input.amountPaise,
      currency: "INR",
      status: "pending",
    })
    .returning({ id: schema.payments.id });

  const idempotencyKey = randomUUID();
  const [attempt] = await tx
    .insert(schema.paymentAttempts)
    .values({
      paymentId: payment.id,
      bookingId: input.bookingId,
      attemptNo: 1,
      gateway: input.gateway,
      gatewayOrderId: input.gatewayOrderId,
      amountPaise: input.amountPaise,
      currency: "INR",
      status: "created",
      idempotencyKey,
    })
    .returning({ id: schema.paymentAttempts.id });

  return { paymentId: payment.id, attemptId: attempt.id, attemptNo: 1, idempotencyKey };
}

/** Start a fresh retry attempt after a prior failure. */
export async function addPaymentAttempt(
  tx: Tx,
  input: { paymentId: string; bookingId: string; amountPaise: number; gateway: string; gatewayOrderId: string | null },
): Promise<{ attemptId: string; attemptNo: number; idempotencyKey: string }> {
  const prior = await tx
    .select({ attemptNo: schema.paymentAttempts.attemptNo })
    .from(schema.paymentAttempts)
    .where(eq(schema.paymentAttempts.paymentId, input.paymentId))
    .orderBy(desc(schema.paymentAttempts.attemptNo))
    .limit(1);
  const attemptNo = (prior[0]?.attemptNo ?? 0) + 1;
  const idempotencyKey = randomUUID();

  const [attempt] = await tx
    .insert(schema.paymentAttempts)
    .values({
      paymentId: input.paymentId,
      bookingId: input.bookingId,
      attemptNo,
      gateway: input.gateway,
      gatewayOrderId: input.gatewayOrderId,
      amountPaise: input.amountPaise,
      currency: "INR",
      status: "created",
      idempotencyKey,
    })
    .returning({ id: schema.paymentAttempts.id });

  // Payment obligation returns to processing while a new attempt is live.
  await tx.update(schema.payments).set({ status: "processing", updatedAt: new Date() }).where(eq(schema.payments.id, input.paymentId));
  return { attemptId: attempt.id, attemptNo, idempotencyKey };
}

/**
 * Begin a fresh payment retry: create a new gateway intent and a new attempt.
 * Returns the new intentId for the caller to verify/confirm against.
 */
export async function retryPayment(
  db: Database,
  provider: PaymentProvider,
  input: { bookingId: string },
): Promise<{ intentId: string; attemptNo: number }> {
  const payment = await db.query.payments.findFirst({ where: eq(schema.payments.bookingId, input.bookingId) });
  if (!payment) throw new Error(`no payment for booking ${input.bookingId}`);

  const intent = await provider.createPaymentIntent({ bookingId: input.bookingId, amountPaise: payment.amountPaise, currency: "INR" });

  const res = await db.transaction((tx) =>
    addPaymentAttempt(tx, {
      paymentId: payment.id,
      bookingId: input.bookingId,
      amountPaise: payment.amountPaise,
      gateway: provider.name,
      gatewayOrderId: intent.gatewayOrderId,
    }),
  );
  return { intentId: intent.intentId, attemptNo: res.attemptNo };
}

export type RecordVerificationResult = {
  /** true when this exact webhook event was already processed. */
  alreadyProcessed: boolean;
  succeeded: boolean;
  paymentId: string | null;
};

/**
 * Idempotently apply a gateway verification/webhook to the payment records.
 * Records the webhook event first; a replay short-circuits as alreadyProcessed
 * and mutates nothing. On a fresh success it settles the live attempt + payment;
 * on failure it marks the live attempt failed.
 */
export async function recordVerification(
  tx: Tx,
  input: { bookingId: string; gateway: string; verification: PaymentVerification; now: Date },
): Promise<RecordVerificationResult> {
  const { verification: v, gateway, now } = input;

  // Layer 1: webhook idempotency ledger.
  const inserted = await tx
    .insert(schema.gatewayWebhookEvents)
    .values({ gateway, eventId: v.eventId, eventType: v.succeeded ? "payment.succeeded" : "payment.failed", bookingId: input.bookingId })
    .onConflictDoNothing({ target: [schema.gatewayWebhookEvents.gateway, schema.gatewayWebhookEvents.eventId] })
    .returning({ id: schema.gatewayWebhookEvents.id });

  const payment = await tx.query.payments.findFirst({ where: eq(schema.payments.bookingId, input.bookingId) });
  if (!payment) return { alreadyProcessed: false, succeeded: v.succeeded, paymentId: null };

  if (inserted.length === 0) {
    // Already processed this webhook — no-op.
    return { alreadyProcessed: true, succeeded: payment.status === "succeeded", paymentId: payment.id };
  }

  // Layer 2/3: settle the most recent live attempt.
  const [attempt] = await tx
    .select({ id: schema.paymentAttempts.id })
    .from(schema.paymentAttempts)
    .where(and(eq(schema.paymentAttempts.paymentId, payment.id)))
    .orderBy(desc(schema.paymentAttempts.attemptNo))
    .limit(1);

  if (v.succeeded) {
    if (attempt) {
      await tx
        .update(schema.paymentAttempts)
        .set({ status: "succeeded", gatewayPaymentId: v.gatewayPaymentId, gatewayFeePaise: v.gatewayFeePaise, capturedAt: now, updatedAt: now })
        .where(eq(schema.paymentAttempts.id, attempt.id));
    }
    await tx
      .update(schema.payments)
      .set({ status: "succeeded", succeededAttemptId: attempt?.id ?? null, gatewayFeePaise: v.gatewayFeePaise, capturedAt: now, updatedAt: now })
      .where(eq(schema.payments.id, payment.id));
    return { alreadyProcessed: false, succeeded: true, paymentId: payment.id };
  }

  if (attempt) {
    await tx
      .update(schema.paymentAttempts)
      .set({ status: "failed", failureReason: v.failureReason ?? "declined", failedAt: now, updatedAt: now })
      .where(eq(schema.paymentAttempts.id, attempt.id));
  }
  // Payment obligation stays pending/failed; a retry can add a new attempt.
  await tx.update(schema.payments).set({ status: "failed", updatedAt: now }).where(eq(schema.payments.id, payment.id));
  return { alreadyProcessed: false, succeeded: false, paymentId: payment.id };
}
