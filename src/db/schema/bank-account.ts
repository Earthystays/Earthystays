/**
 * bank_accounts — host payout destination. Phase 1B.5 Phase B.
 *
 * The account number is NEVER stored in the clear: `account_ref` holds an
 * encrypted / tokenized representation and `account_last4` is display-only.
 * Bank-account changes are append-only history: a change supersedes the old row
 * (sets `effective_to` + clears `is_primary`) and inserts a new row — digits on
 * an existing row are never edited. Exactly one live primary per payment
 * account is enforced by a partial unique index.
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
import { sql } from "drizzle-orm";
import { createdAt, updatedAt, uuidDefault } from "./_shared";
import { bankVerificationStatus } from "./enums";
import { paymentAccounts } from "./payment-account";

export const bankAccounts = pgTable(
  "bank_accounts",
  {
    id: uuid("id").primaryKey().default(uuidDefault),

    paymentAccountId: uuid("payment_account_id")
      .notNull()
      .references(() => paymentAccounts.id),

    accountHolderName: text("account_holder_name").notNull(),

    /** Encrypted / tokenized account number. NEVER plaintext credentials. */
    accountRef: text("account_ref").notNull(),
    /** Display only, e.g. "6411". */
    accountLast4: text("account_last4").notNull(),

    ifsc: text("ifsc").notNull(),

    verificationStatus: bankVerificationStatus("verification_status")
      .notNull()
      .default("unverified"),
    providerVerificationRef: text("provider_verification_ref"),

    isPrimary: boolean("is_primary").notNull().default(false),

    effectiveFrom: timestamp("effective_from", { withTimezone: true })
      .notNull()
      .defaultNow(),
    /** Null = current row; set when superseded by a newer account. */
    effectiveTo: timestamp("effective_to", { withTimezone: true }),

    createdAt,
    updatedAt,
  },
  (t) => [
    index("bank_accounts_account_idx").on(t.paymentAccountId),
    index("bank_accounts_verification_idx").on(t.verificationStatus),
    // Exactly one live primary bank account per payment account.
    uniqueIndex("bank_accounts_one_primary_uq")
      .on(t.paymentAccountId)
      .where(sql`${t.isPrimary} AND ${t.effectiveTo} IS NULL`),
  ],
);

export type BankAccountRow = typeof bankAccounts.$inferSelect;
export type NewBankAccountRow = typeof bankAccounts.$inferInsert;
