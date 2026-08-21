/**
 * payment_accounts — a host's (or the internal Earthy entity's) financial /
 * payout profile. Phase 1B.5 Phase B.
 *
 * No payment provider is integrated. `provider` / `provider_account_id` are
 * placeholders that a later gateway phase populates. A host CANNOT receive a
 * confirmed paid booking until this account is active with verified KYC and a
 * verified bank account (enforced in the payout/booking phases, not here).
 *
 * One PaymentAccount per user (unique). Earthy-owned inventory is represented
 * by an internal user (is_internal) with an internal PaymentAccount so the same
 * booking/ledger architecture applies to owned properties.
 */
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, updatedAt, uuidDefault } from "./_shared";
import {
  entityType,
  kycStatus,
  onboardingStatus,
} from "./enums";
import { users } from "./users";

export const paymentAccounts = pgTable(
  "payment_accounts",
  {
    id: uuid("id").primaryKey().default(uuidDefault),

    userId: text("user_id")
      .notNull()
      .references(() => users.id),

    /** Placeholder until a gateway is integrated (e.g. "razorpay"/"cashfree"). */
    provider: text("provider"),
    providerAccountId: text("provider_account_id"),

    legalName: text("legal_name"),
    entityType: entityType("entity_type"),

    /** Tax identifiers — stored as plain references here; encrypt at rest in prod. */
    pan: text("pan"),
    gstin: text("gstin"),

    isInternal: boolean("is_internal").notNull().default(false),

    onboardingStatus: onboardingStatus("onboarding_status")
      .notNull()
      .default("not_started"),
    /** Mirror of the latest KYC record's status for fast gating reads. */
    kycStatus: kycStatus("kyc_status").notNull().default("pending"),
    /** Derived gate — never true until KYC + bank verified (later phases). */
    payoutEligible: boolean("payout_eligible").notNull().default(false),

    importedAt: timestamp("imported_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (t) => [
    uniqueIndex("payment_accounts_user_uq").on(t.userId),
    index("payment_accounts_kyc_idx").on(t.kycStatus),
    index("payment_accounts_eligible_idx").on(t.payoutEligible),
  ],
);

export type PaymentAccountRow = typeof paymentAccounts.$inferSelect;
export type NewPaymentAccountRow = typeof paymentAccounts.$inferInsert;
