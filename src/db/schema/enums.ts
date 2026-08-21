/**
 * PostgreSQL enum catalogue for the financial foundation.
 *
 * Phase 1B.5. All values are LOCKED per the Phase 1B.5 business rules and the
 * Phase 1B.1 architecture. State is deliberately split — booking operational
 * status, payment status, and payout status are SEPARATE enums; there is no
 * single generic "status".
 *
 * Defining every enum here in Phase A means later phases (Booking, Payment,
 * Ledger, …) only add TABLES, never new state vocabularies.
 */
import { pgEnum } from "drizzle-orm/pg-core";

/* ── User / admin ─────────────────────────────────────────────────────── */

export const userRole = pgEnum("user_role", [
  "guest",
  "host",
  "admin",
  "internal", // the Earthy internal entity for owned inventory
]);

export const userStatus = pgEnum("user_status", [
  "active",
  "suspended",
  "deactivated",
]);

/** Individual admin identities (replaces the shared admin password). */
export const adminRole = pgEnum("admin_role", [
  "SUPER_ADMIN",
  "FINANCE_ADMIN",
  "OPERATIONS_ADMIN",
]);

/** Who performed an action (audit + cancellation attribution). */
export const actorKind = pgEnum("actor_kind", [
  "guest",
  "host",
  "admin",
  "system",
]);

/* ── Listings ─────────────────────────────────────────────────────────── */

export const propertyType = pgEnum("property_type", [
  "villa",
  "apartment",
  "hotel",
  "hostel",
]);

export const listingStatus = pgEnum("listing_status", [
  "draft",
  "active",
  "paused",
  "archived",
]);

export const bookingKind = pgEnum("booking_kind", ["property", "experience"]);

/* ── Cancellation ─────────────────────────────────────────────────────── */

export const cancellationPolicy = pgEnum("cancellation_policy", [
  "flexible",
  "moderate",
  "strict",
]);

/* ── Booking state (three independent axes) ───────────────────────────── */

export const bookingStatus = pgEnum("booking_status", [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "CANCELLED",
  "CHECKED_IN",
  "COMPLETED",
  "EXPIRED",
]);

export const paymentStatus = pgEnum("payment_status", [
  "UNPAID",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REFUND_PENDING",
  "PARTIALLY_REFUNDED",
  "REFUNDED",
]);

export const payoutStatus = pgEnum("payout_status", [
  "NOT_ELIGIBLE",
  "ON_HOLD",
  "ELIGIBLE",
  "PROCESSING",
  "PAID",
  "FAILED",
  "REVERSED",
  "ADJUSTED",
]);

/* ── Payment attempts ─────────────────────────────────────────────────── */

/** Gateway-agnostic attempt state. */
export const paymentAttemptStatus = pgEnum("payment_attempt_status", [
  "created",
  "pending",
  "authorized",
  "captured",
  "succeeded",
  "failed",
  "cancelled",
]);

/** The single payment obligation's settlement state (the Payment record). */
export const paymentRecordStatus = pgEnum("payment_record_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "refunded",
  "partially_refunded",
]);

/**
 * Kind of payment obligation. V1 collects 100% up front, so only `full` is
 * used; advance/balance are reserved so the enum need not be altered later.
 */
export const paymentKind = pgEnum("payment_kind", ["full", "advance", "balance"]);

/* ── Inventory hold (15-minute checkout hold) ─────────────────────────── */

export const inventoryHoldStatus = pgEnum("inventory_hold_status", [
  "active",
  "expired",
  "released",
  "converted", // hold turned into a confirmed booking
]);

/** What kind of inventory a hold/booking targets. */
export const inventoryType = pgEnum("inventory_type", ["property", "experience"]);

/** Financial lifecycle of a booking — distinct from booking/payment/payout. */
export const financialStatus = pgEnum("financial_status", [
  "OPEN",
  "SETTLED",
  "REFUNDING",
  "REFUNDED",
  "DISPUTED",
  "ADJUSTED",
]);

/* ── Host financial onboarding ────────────────────────────────────────── */

export const entityType = pgEnum("entity_type", [
  "individual",
  "sole_proprietor",
  "partnership",
  "llp",
  "private_limited",
  "internal",
]);

export const onboardingStatus = pgEnum("onboarding_status", [
  "not_started",
  "in_progress",
  "submitted",
  "active",
  "suspended",
]);

export const kycStatus = pgEnum("kyc_status", [
  "pending",
  "submitted",
  "under_review",
  "verified",
  "rejected",
  "action_required",
]);

export const bankVerificationStatus = pgEnum("bank_verification_status", [
  "unverified",
  "pending",
  "verified",
  "failed",
]);

/* ── Rules ────────────────────────────────────────────────────────────── */

export const taxCategory = pgEnum("tax_category", [
  "accommodation",
  "experience",
  "service",
  "other",
]);

/** Threshold comparator for a tax rule (per unit per day). */
export const taxComparator = pgEnum("tax_comparator", ["lte", "gt"]);

export const commissionScope = pgEnum("commission_scope", [
  "global",
  "category",
  "host",
  "property",
  "experience",
  "promotional",
  "booking_override",
]);

/* ── Ledger (immutable double-entry) ──────────────────────────────────── */

export const ledgerDirection = pgEnum("ledger_direction", ["debit", "credit"]);

/** Chart of accounts. The exact statutory mapping is reviewed with the CA;
 *  these are internal account references, not a finalized statutory chart. */
export const ledgerAccount = pgEnum("ledger_account", [
  "guest_cash",
  "gateway_clearing",
  "gateway_fee_expense",
  "earthy_commission_revenue",
  "host_payable_liability",
  "host_payout_clearing",
  "refund_payable",
  "gst_payable",
  "adjustment_expense",
  "adjustment_income",
  "dispute_hold",
  "internal_inventory_equity",
]);

export const ledgerEventType = pgEnum("ledger_event_type", [
  "payment_captured",
  "gateway_fee",
  "commission_recognized",
  "gst_recognized",
  "refund_issued",
  "commission_reversed",
  "payout_scheduled",
  "payout_paid",
  "payout_reversed",
  "adjustment_credit",
  "adjustment_debit",
  "dispute_hold",
  "dispute_release",
]);

/* ── Refunds ──────────────────────────────────────────────────────────── */

export const refundType = pgEnum("refund_type", ["full", "partial"]);

export const refundTrigger = pgEnum("refund_trigger", [
  "cancellation",
  "host_cancellation",
  "manual",
  "dispute",
  "overpayment",
]);

export const refundStatus = pgEnum("refund_status", [
  "pending",
  "processing",
  "succeeded",
  "failed",
  "cancelled",
]);

/* ── Adjustments ──────────────────────────────────────────────────────── */

export const adjustmentType = pgEnum("adjustment_type", [
  "host_cancellation_penalty",
  "guest_compensation",
  "goodwill",
  "clawback",
  "correction",
  "overpayment",
  "post_payout_recovery",
]);

export const adjustmentStatus = pgEnum("adjustment_status", [
  "pending",
  "applied",
  "settled",
  "cancelled",
]);

/* ── Disputes ─────────────────────────────────────────────────────────── */

export const disputeSource = pgEnum("dispute_source", [
  "guest_complaint",
  "gateway_chargeback",
  "admin_created",
]);

export const disputeStatus = pgEnum("dispute_status", [
  "open",
  "under_review",
  "awaiting_evidence",
  "resolved",
  "closed",
]);

export const disputeResolution = pgEnum("dispute_resolution", [
  "guest_favor",
  "host_favor",
  "split",
  "withdrawn",
]);
