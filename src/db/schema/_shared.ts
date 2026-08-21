/**
 * Shared column builders and money primitives for the financial schema.
 *
 * Phase 1B.5 — Financial Foundation. See docs/phase-1b1-financial-db-architecture.md.
 *
 * MONEY RULES (locked):
 *   • All monetary amounts are stored as integer paise in a PostgreSQL `bigint`.
 *     ₹1 = 100 paise. NEVER floating point.
 *   • All rates/percentages are stored as integer basis points. 15% = 1500 bps.
 *   • Rounding is HALF-UP.
 *   • Currency is INR only for V1 but every money-bearing row carries an
 *     explicit `currency` column for future multi-currency.
 *
 * `bigint` is declared with `mode: "number"`. Paise values for realistic
 * bookings stay far below Number.MAX_SAFE_INTEGER (2^53 ≈ ₹90.07 trillion),
 * so JS numbers are safe here and far more ergonomic than bigint literals.
 */
import { sql } from "drizzle-orm";
import { bigint, char, integer, timestamp } from "drizzle-orm/pg-core";

/** A monetary amount in integer paise (bigint). Pass the column name. */
export const money = (name: string) => bigint(name, { mode: "number" });

/** A rate in integer basis points (1500 = 15%). */
export const bps = (name: string) => integer(name);

/** ISO-4217 currency code. Defaults to INR for V1. */
export const currency = (name = "currency") =>
  char(name, { length: 3 }).notNull().default("INR");

/** created_at — set once by the database. */
export const createdAt = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/** updated_at — set on insert; services bump it on update. */
export const updatedAt = timestamp("updated_at", { withTimezone: true })
  .notNull()
  .defaultNow();

/** A nullable point-in-time timestamptz column (e.g. confirmed_at). */
export const tsCol = (name: string) =>
  timestamp(name, { withTimezone: true });

/** Standard { created_at, updated_at } pair spread into a table definition. */
export const timestamps = { createdAt, updatedAt };

/** Default expression for a new UUID primary key. */
export const uuidDefault = sql`gen_random_uuid()`;

/**
 * Half-up rounding to the nearest integer paise.
 * Used by the tax and commission engines (Phases E/F). Kept here so the money
 * contract lives in one place and is unit-testable without a database.
 *
 * Half-up = round to nearest; exact .5 rounds away from zero.
 */
export function roundHalfUp(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(`roundHalfUp: non-finite value ${value}`);
  }
  return value < 0
    ? -Math.round(-value + Number.EPSILON)
    : Math.round(value + Number.EPSILON);
}

/** Rupees (possibly fractional) → integer paise, half-up. */
export function rupeesToPaise(rupees: number): number {
  return roundHalfUp(rupees * 100);
}

/** Integer paise → rupees (number) for display only. */
export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/**
 * Apply a basis-point rate to a paise amount, half-up.
 * e.g. applyBps(2000000, 1500) → 15% of ₹20,000 = ₹3,000 = 300000 paise.
 */
export function applyBps(amountPaise: number, rateBps: number): number {
  return roundHalfUp((amountPaise * rateBps) / 10000);
}
