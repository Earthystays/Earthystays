/**
 * Provider-agnostic payment boundary. Phase 1B.5 Phase C.
 *
 * This is the seam that a real gateway (Cashfree/Razorpay) plugs into LATER.
 * The core booking flow only ever speaks this interface, never a vendor SDK.
 *
 * Conceptual flow:
 *   createBooking() → createInventoryHold() → createPaymentIntent()
 *     → [external gateway, later] → verifyPayment() → confirmBooking()
 */
export type PaymentIntentStatus = "created" | "succeeded" | "failed";

export type PaymentIntent = {
  intentId: string;
  bookingId: string;
  amountPaise: number;
  currency: "INR";
  status: PaymentIntentStatus;
  /** Opaque gateway order id placeholder. */
  gatewayOrderId: string;
};

export type PaymentVerification = {
  intentId: string;
  bookingId: string;
  succeeded: boolean;
  gatewayPaymentId: string | null;
  /** Amount the provider reports as paid, in paise — validated server-side. */
  amountPaise: number;
  /** Currency the provider reports — validated to equal INR server-side. */
  currency: string;
  /** Gateway event id — the webhook dedupe key (stable across re-deliveries). */
  eventId: string;
  /** Gateway fee Earthy absorbs, in paise. Never reduces host payable. */
  gatewayFeePaise: number;
  /** True when this verification is a repeat of an already-seen callback. */
  duplicate: boolean;
  failureReason?: string;
};

export interface PaymentProvider {
  readonly name: string;
  createPaymentIntent(input: {
    bookingId: string;
    amountPaise: number;
    currency: "INR";
  }): Promise<PaymentIntent>;
  /** Verify a gateway callback/webhook. MUST be idempotent per intent. */
  verifyPayment(input: { intentId: string; token: string }): Promise<PaymentVerification>;
}
