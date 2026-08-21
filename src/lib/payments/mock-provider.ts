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

type Recorded = { succeeded: boolean; gatewayPaymentId: string | null; failureReason?: string };

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
        duplicate: false,
        failureReason: "unknown_intent",
      };
    }

    // Idempotency: replay the first recorded outcome for this intent.
    const seen = this.verifications.get(input.intentId);
    if (seen) {
      return {
        intentId: input.intentId,
        bookingId: intent.bookingId,
        succeeded: seen.succeeded,
        gatewayPaymentId: seen.gatewayPaymentId,
        duplicate: true,
        failureReason: seen.failureReason,
      };
    }

    if (input.token.startsWith("delayed:")) {
      const ms = Number(input.token.split(":")[1] ?? "0");
      await new Promise((r) => setTimeout(r, Number.isFinite(ms) ? ms : 0));
    }

    const succeeded = input.token === "success" || input.token.startsWith("delayed:");
    const recorded: Recorded = succeeded
      ? { succeeded: true, gatewayPaymentId: `mock_pay_${intent.intentId}` }
      : { succeeded: false, gatewayPaymentId: null, failureReason: "declined" };
    this.verifications.set(input.intentId, recorded);
    intent.status = succeeded ? "succeeded" : "failed";

    return {
      intentId: input.intentId,
      bookingId: intent.bookingId,
      succeeded: recorded.succeeded,
      gatewayPaymentId: recorded.gatewayPaymentId,
      duplicate: false,
      failureReason: recorded.failureReason,
    };
  }
}
