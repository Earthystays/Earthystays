/**
 * Typed booking errors. Phase 1B.5 Phase C.
 * Every rejection carries a stable machine `code` and a human `message`.
 */
export type BookingErrorCode =
  | "GUEST_NOT_FOUND"
  | "HOST_NOT_FOUND"
  | "PROPERTY_NOT_FOUND"
  | "EXPERIENCE_NOT_FOUND"
  | "INVALID_TARGET" // both or neither property/experience
  | "INVALID_DATES"
  | "INVALID_GUEST_COUNT"
  | "CURRENCY_NOT_SUPPORTED" // INR only
  | "INVENTORY_NOT_BOOKABLE" // listing not active
  | "INVENTORY_UNAVAILABLE" // conflicting active hold / confirmed booking
  | "HOST_FINANCIAL_ACCOUNT_NOT_READY" // experience persona not mapped to a payout user
  | "HOLD_NOT_ACTIVE"
  | "PAYMENT_NOT_VERIFIED"
  | "BOOKING_NOT_PENDING";

export class BookingError extends Error {
  constructor(
    public readonly code: BookingErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "BookingError";
  }
}
