/**
 * Mock/test payment adapter. Phase 1B.5 Phase C.
 *
 * FOR DEVELOPMENT AND AUTOMATED TESTS ONLY. This is NOT a production gateway
 * and must never be wired to real money. It exists so the financial/booking
 * engine can be exercised end-to-end without Cashfree/Razorpay.
 *
 * The verify `token` encodes the desired outcome so tests can drive scenarios:
 *   "success" | "failure" | "delayed:<ms>"
 * Idempotency: verifying the same intent twice returns duplicate=true and the
 * SAME outcome as the first call — this is what the booking layer relies on to
 * make duplicate callbacks safe.
 */
import type {
  PaymentIntent,
  PaymentProvider,
  PaymentVerification,
} from "./types";

type Recorded = {
  succeeded: boolean;
  gatewayPaymentId: string | null;
  gatewayFeePaise: number;
  amountPaise: number;
  currency: string;
  failureReason?: string;
};

/** Nominal mock gateway fee: 2% of the amount, half-up. Illustrative only. */
function mockFee(amountPaise: number): number {
  return Math.round(amountPaise * 0.02);
}

export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  private intents = new Map<string, PaymentIntent>();
  private verifications = new Map<string, Recorded>();
  private counter = 0;

  async createPaymentIntent(input: {
    bookingId: string;
    amountPaise: number;
    currency: "INR";
  }): Promise<PaymentIntent> {
    this.counter += 1;
    const intent: PaymentIntent = {
      intentId: `mock_int_${this.counter}`,
      bookingId: input.bookingId,
      amountPaise: input.amountPaise,
      currency: input.currency,
      status: "created",
      gatewayOrderId: `mock_order_${this.counter}`,
    };
    this.intents.set(intent.intentId, intent);
    return intent;
  }

  async verifyPayment(input: { intentId: string; token: string }): Promise<PaymentVerification> {
    const intent = this.intents.get(input.intentId);
    if (!intent) {
      return {
        intentId: input.intentId,
        bookingId: "",
        succeeded: false,
        gatewayPaymentId: null,
        amountPaise: 0,
        currency: "INR",
        eventId: `evt_${input.intentId}`,
        gatewayFeePaise: 0,
        duplicate: false,
        failureReason: "unknown_intent",
      };
    }

    // Idempotency: replay the first recorded outcome for this intent, with the
    // SAME stable event id so downstream webhook dedupe recognises the replay.
    const seen = this.verifications.get(input.intentId);
    if (seen) {
      return this.toVerification(input.intentId, intent.bookingId, seen, true);
    }

    // Token grammar (test-only):
    //   "success"            → pays the intent amount in INR
    //   "failure"            → declined
    //   "delayed:<ms>"       → success after a delay
    //   "amount:<paise>"     → success but reports a WRONG amount (over/under)
    //   "currency:<CUR>"     → success but reports a wrong currency
    const token = input.token;
    if (token.startsWith("delayed:")) {
      const ms = Number(token.split(":")[1] ?? "0");
      await new Promise((r) => setTimeout(r, Number.isFinite(ms) ? ms : 0));
    }

    let recorded: Recorded;
    if (token === "failure") {
      recorded = { succeeded: false, gatewayPaymentId: null, gatewayFeePaise: 0, amountPaise: 0, currency: "INR", failureReason: "declined" };
    } else if (token.startsWith("amount:")) {
      const amt = Number(token.split(":")[1]);
      recorded = { succeeded: true, gatewayPaymentId: `mock_pay_${intent.intentId}`, gatewayFeePaise: mockFee(amt), amountPaise: amt, currency: "INR" };
    } else if (token.startsWith("currency:")) {
      recorded = { succeeded: true, gatewayPaymentId: `mock_pay_${intent.intentId}`, gatewayFeePaise: mockFee(intent.amountPaise), amountPaise: intent.amountPaise, currency: token.split(":")[1] ?? "USD" };
    } else {
      // "success" or "delayed:*"
      recorded = { succeeded: true, gatewayPaymentId: `mock_pay_${intent.intentId}`, gatewayFeePaise: mockFee(intent.amountPaise), amountPaise: intent.amountPaise, currency: "INR" };
    }
    this.verifications.set(input.intentId, recorded);
    intent.status = recorded.succeeded ? "succeeded" : "failed";
    return this.toVerification(input.intentId, intent.bookingId, recorded, false);
  }

  private toVerification(intentId: string, bookingId: string, r: Recorded, duplicate: boolean): PaymentVerification {
    return {
      intentId,
      bookingId,
      succeeded: r.succeeded,
      gatewayPaymentId: r.gatewayPaymentId,
      amountPaise: r.amountPaise,
      currency: r.currency,
      eventId: `evt_${intentId}`,
      gatewayFeePaise: r.gatewayFeePaise,
      duplicate,
      failureReason: r.failureReason,
    };
  }
}
