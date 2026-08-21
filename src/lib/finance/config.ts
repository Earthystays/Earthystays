/**
 * Configurable finance defaults. Phase 1B.5.
 *
 * Centralised so V1 defaults are a single, overridable configuration point
 * rather than constants buried in booking logic. These affect ONLY new bookings
 * at creation time — legacy source JSON and historical records are never
 * modified, and the resolved policy is snapshotted immutably onto each Booking.
 *
 * CONFIRMED DECISION (Phase D): when an existing property has no usable
 * cancellation policy, new bookings default to MODERATE and snapshot MODERATE's
 * exact structured terms. Future work can source these from an admin-editable
 * settings table without touching call sites.
 */
import type { CancellationPolicyType } from "./cancellation-policies";

export type FinanceDefaults = {
  /** Fallback cancellation policy when a property carries none. */
  propertyCancellationPolicy: CancellationPolicyType;
  /** Fallback cancellation policy for experiences (legacy policy is free text). */
  experienceCancellationPolicy: CancellationPolicyType;
};

/** V1 defaults. Replace the source of this object to make it admin-configurable. */
export const FINANCE_DEFAULTS: FinanceDefaults = {
  propertyCancellationPolicy: "moderate",
  experienceCancellationPolicy: "flexible",
};
