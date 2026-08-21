/**
 * Payment persistence, attempts, and idempotent server-side verification.
 * Phase 1B.5 Phase D. NO real money, NO ledger posting.
 *
 * Boundaries (spec §4/§5/§7/§16):
 *   • initPayment(tx)      — one UNPAID obligation per booking, created WITH the
 *                            booking. No attempt yet.
 *   • startPayment(deps)   — begins a charge: new PaymentAttempt (PROCESSING) +
 *                            provider intent. Called again = a retry.
 *   • recordVerification(tx)— the verification core: validate amount/currency/
 *                            booking relationship, dedupe the webhook, settle
 *                            attempt+payment, or record a discrepancy. Never
 *                            confirms the booking (the booking service does).
 *
 * Idempotency (spec §8) is DB-enforced: gateway_webhook_events(gateway,event_id)
 * UNIQUE, payment_attempts.gateway_payment_id UNIQUE, .idempotency_key UNIQUE.
 */
import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import type { Database, Tx } from "../../db/client";
import * as schema from "../../db/schema";
import type { AuditSink } from "../booking/audit";
import type { PaymentProvider, PaymentVerification } from "./types";

/** Create the single payment obligation (UNPAID). No attempt yet. */
export async function initPayment(
  tx: Tx,
  input: { bookingId: string; amountPaise: number },
): Promise<{ paymentId: string }> {
  const [payment] = await tx
    .insert(schema.payments)
    .values({
      bookingId: input.bookingId,
      kind: "full",
      amountPaise: input.amountPaise,
      currency: "INR",
      status: "UNPAID",
      idempotencyKey: randomUUID(),
    })
    .returning({ id: schema.payments.id });
  return { paymentId: payment.id };
}

export type StartPaymentResult = {
  paymentId: string;
  attemptId: string;
  attemptNo: number;
  intentId: string;
  idempotencyKey: string;
};

/**
 * Begin (or retry) a charge: create a PROCESSING attempt and a provider intent.
 * Opens its own transaction. Returns the intentId to verify against.
 */
export async function startPayment(
  deps: { db: Database; provider: PaymentProvider; audit?: AuditSink; now?: () => Date },
  input: { bookingId: string },
): Promise<StartPaymentResult> {
  const now = deps.now?.() ?? new Date();
  const payment = await deps.db.query.payments.findFirst({ where: eq(schema.payments.bookingId, input.bookingId) });
  if (!payment) throw new Error(`no payment obligation for booking ${input.bookingId}`);

  const intent = await deps.provider.createPaymentIntent({ bookingId: input.bookingId, amountPaise: payment.amountPaise, currency: "INR" });

  const res = await deps.db.transaction(async (tx) => {
    const prior = await tx
      .select({ attemptNo: schema.paymentAttempts.attemptNo })
      .from(schema.paymentAttempts)
      .where(eq(schema.paymentAttempts.paymentId, payment.id))
      .orderBy(desc(schema.paymentAttempts.attemptNo))
      .limit(1);
    const attemptNo = (prior[0]?.attemptNo ?? 0) + 1;
    const idempotencyKey = randomUUID();

    const [attempt] = await tx
      .insert(schema.paymentAttempts)
      .values({
        paymentId: payment.id,
        bookingId: input.bookingId,
        attemptNo,
        provider: deps.provider.name,
        gatewayOrderId: intent.gatewayOrderId,
        amountPaise: payment.amountPaise,
        currency: "INR",
        status: "PROCESSING",
        idempotencyKey,
        requestId: randomUUID(),
      })
      .returning({ id: schema.paymentAttempts.id });

    await tx.update(schema.payments).set({ status: "PROCESSING", provider: deps.provider.name, updatedAt: now }).where(eq(schema.payments.id, payment.id));
    return { attemptId: attempt.id, attemptNo, idempotencyKey };
  });

  await deps.audit?.emit({ action: "payment.attempt.created", entity: "payment_attempt", entityId: res.attemptId, actorKind: "system", at: now.toISOString(), metadata: { attemptNo: res.attemptNo } });

  return { paymentId: payment.id, ...res, intentId: intent.intentId };
}

export type RecordVerificationResult = {
  alreadyProcessed: boolean;
  succeeded: boolean;
  /** true when the provider event was rejected (amount/currency/relationship). */
  discrepancy: boolean;
  discrepancyType?: "WRONG_AMOUNT" | "OVERPAYMENT" | "UNDERPAYMENT" | "CURRENCY_MISMATCH";
  paymentId: string | null;
};

/**
 * The verification core (spec §7/§9/§14/§15). Validates the provider event
 * against the stored obligation, is idempotent, and either settles the
 * payment/attempt or records a discrepancy. Does NOT touch the booking.
 */
export async function recordVerification(
  tx: Tx,
  input: { bookingId: string; gateway: string; verification: PaymentVerification; now: Date; audit?: AuditSink },
): Promise<RecordVerificationResult> {
  const { verification: v, gateway, now, audit } = input;

  const payment = await tx.query.payments.findFirst({ where: eq(schema.payments.bookingId, input.bookingId) });
  if (!payment) return { alreadyProcessed: false, succeeded: false, discrepancy: false, paymentId: null };

  const latestAttempt = async () => {
    const [a] = await tx
      .select({ id: schema.paymentAttempts.id })
      .from(schema.paymentAttempts)
      .where(eq(schema.paymentAttempts.paymentId, payment.id))
      .orderBy(desc(schema.paymentAttempts.attemptNo))
      .limit(1);
    return a?.id ?? null;
  };

  // ── Relationship + amount + currency validation (only meaningful on success)
  if (v.succeeded) {
    const relationshipOk = v.bookingId === input.bookingId;
    const currencyOk = v.currency === "INR" && payment.currency === "INR";
    const amountOk = v.amountPaise === payment.amountPaise;

    if (!relationshipOk || !currencyOk || !amountOk) {
      const type: RecordVerificationResult["discrepancyType"] = !currencyOk
        ? "CURRENCY_MISMATCH"
        : v.amountPaise > payment.amountPaise
          ? "OVERPAYMENT"
          : v.amountPaise < payment.amountPaise
            ? "UNDERPAYMENT"
            : "WRONG_AMOUNT";
      const attemptId = await latestAttempt();
      await tx.insert(schema.paymentDiscrepancies).values({
        bookingId: input.bookingId,
        paymentId: payment.id,
        paymentAttemptId: attemptId,
        type,
        expectedAmountPaise: payment.amountPaise,
        providerAmountPaise: v.amountPaise,
        expectedCurrency: "INR",
        providerCurrency: v.currency,
        gatewayPaymentId: v.gatewayPaymentId,
        note: relationshipOk ? null : `booking mismatch: event=${v.bookingId} expected=${input.bookingId}`,
      });
      if (attemptId) {
        await tx.update(schema.paymentAttempts).set({ status: "FAILED", failureCode: type, failureMessage: "provider event rejected", completedAt: now, updatedAt: now }).where(eq(schema.paymentAttempts.id, attemptId));
      }
      await audit?.emit({ action: "payment.discrepancy", entity: "payment", entityId: payment.id, actorKind: "system", at: now.toISOString(), metadata: { type, providerAmountPaise: v.amountPaise, expectedAmountPaise: payment.amountPaise, providerCurrency: v.currency } });
      return { alreadyProcessed: false, succeeded: false, discrepancy: true, discrepancyType: type, paymentId: payment.id };
    }
  }

  // ── Idempotency ledger: a replayed webhook is a no-op.
  const inserted = await tx
    .insert(schema.gatewayWebhookEvents)
    .values({ gateway, eventId: v.eventId, eventType: v.succeeded ? "payment.succeeded" : "payment.failed", bookingId: input.bookingId })
    .onConflictDoNothing({ target: [schema.gatewayWebhookEvents.gateway, schema.gatewayWebhookEvents.eventId] })
    .returning({ id: schema.gatewayWebhookEvents.id });

  if (inserted.length === 0) {
    return { alreadyProcessed: true, succeeded: payment.status === "PAID", discrepancy: false, paymentId: payment.id };
  }

  const attemptId = await latestAttempt();

  if (v.succeeded) {
    if (attemptId) {
      await tx.update(schema.paymentAttempts).set({ status: "SUCCEEDED", gatewayPaymentId: v.gatewayPaymentId, gatewayFeePaise: v.gatewayFeePaise, completedAt: now, updatedAt: now }).where(eq(schema.paymentAttempts.id, attemptId));
    }
    await tx.update(schema.payments).set({ status: "PAID", succeededAttemptId: attemptId, gatewayPaymentId: v.gatewayPaymentId, gatewayFeePaise: v.gatewayFeePaise, paidAt: now, updatedAt: now }).where(eq(schema.payments.id, payment.id));
    await audit?.emit({ action: "payment.attempt.succeeded", entity: "payment_attempt", entityId: attemptId ?? payment.id, actorKind: "system", at: now.toISOString() });
    await audit?.emit({ action: "payment.verified", entity: "payment", entityId: payment.id, actorKind: "system", at: now.toISOString() });
    return { alreadyProcessed: false, succeeded: true, discrepancy: false, paymentId: payment.id };
  }

  // Provider-reported failure: attempt FAILED, obligation stays UNPAID (§11).
  if (attemptId) {
    await tx.update(schema.paymentAttempts).set({ status: "FAILED", failureCode: "declined", failureMessage: v.failureReason ?? "declined", completedAt: now, updatedAt: now }).where(eq(schema.paymentAttempts.id, attemptId));
  }
  await tx.update(schema.payments).set({ status: "UNPAID", updatedAt: now }).where(eq(schema.payments.id, payment.id));
  await audit?.emit({ action: "payment.attempt.failed", entity: "payment_attempt", entityId: attemptId ?? payment.id, actorKind: "system", at: now.toISOString() });
  return { alreadyProcessed: false, succeeded: false, discrepancy: false, paymentId: payment.id };
}
