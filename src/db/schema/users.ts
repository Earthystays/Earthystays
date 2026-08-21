/**
 * users — the root identity table (guest / host / admin / internal entity).
 *
 * Phase 1B.5 foundation. This EXTENDS the existing user concept; it does not
 * replace the surrounding auth/session logic yet. The primary key is `text`
 * (not uuid) so existing JSON ids such as "usr_testhost_001" migrate 1:1 in
 * Phase B without rewriting every downstream reference.
 *
 * Financial sub-records (PaymentAccount, KYC, BankAccount) hang off this table
 * in later phases. The internal Earthy entity for owned inventory is just a
 * row here with role = "internal" / is_internal = true.
 */
import { boolean, index, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./_shared";
import { userRole, userStatus } from "./enums";

export const users = pgTable(
  "users",
  {
    /** Preserved from JSON, e.g. "usr_testhost_001". */
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    phone: text("phone"),
    fullName: text("full_name").notNull(),

    role: userRole("role").notNull().default("guest"),
    isHost: boolean("is_host").notNull().default(false),
    isAdmin: boolean("is_admin").notNull().default(false),
    /** true = the Earthy internal entity backing owned inventory. */
    isInternal: boolean("is_internal").notNull().default(false),

    status: userStatus("status").notNull().default("active"),

    /** Existing password hash from the JSON store (auth is untouched here). */
    passwordHash: text("password_hash"),

    createdAt,
    updatedAt,
  },
  (t) => [
    // Case-insensitive uniqueness is handled at the app layer for now (emails
    // are already lowercased on write); a citext migration can follow later.
    index("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_is_host_idx").on(t.isHost),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type NewUserRow = typeof users.$inferInsert;
