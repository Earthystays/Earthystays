/**
 * kyc_records — KYC review records for a PaymentAccount. Phase 1B.5 Phase B.
 *
 * No real KYC provider is integrated. Sensitive identity documents are NOT
 * stored here — only secure references / opaque tokens in `document_refs`
 * (jsonb) pointing at a secure vault or object store. Structured KYC data the
 * business rules require (legal name, PAN, GSTIN, mobile, email, address,
 * business info) is captured as discrete columns; identity-document images are
 * referenced, never embedded.
 */
import { index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { createdAt, updatedAt, uuidDefault } from "./_shared";
import { kycStatus } from "./enums";
import { paymentAccounts } from "./payment-account";
import { users } from "./users";

export const kycRecords = pgTable(
  "kyc_records",
  {
    id: uuid("id").primaryKey().default(uuidDefault),

    paymentAccountId: uuid("payment_account_id")
      .notNull()
      .references(() => paymentAccounts.id),

    status: kycStatus("status").notNull().default("pending"),

    legalName: text("legal_name"),
    pan: text("pan"),
    gstin: text("gstin"),
    mobile: text("mobile"),
    email: text("email"),
    address: text("address"),
    businessInfo: text("business_info"),

    /** Secure references only (vault keys / tokens). NEVER raw document bytes. */
    documentRefs: jsonb("document_refs"),

    /** External KYC provider reference (placeholder — no provider yet). */
    providerRef: text("provider_ref"),

    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => users.id),
    rejectionReason: text("rejection_reason"),
    actionRequiredNote: text("action_required_note"),

    createdAt,
    updatedAt,
  },
  (t) => [
    index("kyc_records_account_idx").on(t.paymentAccountId),
    index("kyc_records_status_idx").on(t.status),
  ],
);

export type KycRow = typeof kycRecords.$inferSelect;
export type NewKycRow = typeof kycRecords.$inferInsert;
