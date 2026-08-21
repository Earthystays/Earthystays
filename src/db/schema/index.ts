/**
 * Schema barrel for the financial foundation.
 *
 * Phase 1B.5 — Phase A establishes shared primitives, the full enum catalogue,
 * and the root `users` table. Later phases add tables here:
 *   B: properties, experiences, stored_inquiries
 *   C: bookings, inventory_holds
 *   D: payments, payment_attempts
 *   E: tax_rules, commission_rules
 *   F: booking_financials
 *   G: ledger_journals, ledger_entries
 *   H: refunds   I: payouts   J: adjustments   K: disputes
 *   L: admin_users, audit_logs
 *
 * `drizzle.config.ts` points at this file, so exporting a table here is what
 * puts it into the generated migrations.
 */
export * from "./enums";
export * from "./users";

// Phase B — core model + host financial onboarding.
export * from "./properties";
export * from "./experiences";
export * from "./stored-inquiries";
export * from "./payment-account";
export * from "./kyc";
export * from "./bank-account";

// Phase C — real booking + inventory hold.
export * from "./bookings";
export * from "./inventory-holds";

// Phase D — payment obligation + attempts + webhook idempotency.
export * from "./payments";

// Re-export the money/rate helpers so callers can `import { money } from "@/db/schema"`.
export * from "./_shared";
