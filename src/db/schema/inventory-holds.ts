/**
 * inventory_holds — the concurrency-control record for a checkout (Phase C).
 *
 * Every booking attempt writes an ACTIVE hold. A hold blocks conflicting
 * bookings while it is ACTIVE or CONVERTED; EXPIRED / RELEASED holds do not
 * block. Server-side concurrency safety for PROPERTY stays is enforced by a
 * PostgreSQL GiST EXCLUSION CONSTRAINT on (inventory_id, date-range) over the
 * blocking rows — two overlapping active holds for the same property CANNOT
 * both commit. That constraint plus btree_gist is added in the migration SQL
 * (Drizzle cannot yet express exclusion constraints declaratively).
 *
 * Experience capacity is NOT modelled as overlap-exclusion (multiple guests can
 * book the same experience up to capacity); experience concurrency is handled
 * differently in a later phase. The exclusion constraint is therefore scoped to
 * inventory_type = 'property'.
 */
import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { createdAt, uuidDefault } from "./_shared";
import { bookings } from "./bookings";
import { inventoryHoldStatus, inventoryType } from "./enums";

/** 15-minute checkout hold, in milliseconds. */
export const HOLD_DURATION_MS = 15 * 60 * 1000;

export const inventoryHolds = pgTable(
  "inventory_holds",
  {
    id: uuid("id").primaryKey().default(uuidDefault),

    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id),

    inventoryType: inventoryType("inventory_type").notNull(),
    /** property slug or experience slug. */
    inventoryId: text("inventory_id").notNull(),

    /** Blocking window. Property: [check_in, check_out). Experience: the day. */
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    endDate: timestamp("end_date", { withTimezone: true }).notNull(),

    unitsCount: integer("units_count").notNull().default(1),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    status: inventoryHoldStatus("status").notNull().default("active"),

    createdAt,
    releasedAt: timestamp("released_at", { withTimezone: true }),
    convertedAt: timestamp("converted_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
  },
  (t) => [
    index("inventory_holds_booking_idx").on(t.bookingId),
    index("inventory_holds_inventory_idx").on(t.inventoryType, t.inventoryId),
    index("inventory_holds_status_idx").on(t.status),
    index("inventory_holds_expires_idx").on(t.expiresAt),
  ],
);

export type InventoryHoldRow = typeof inventoryHolds.$inferSelect;
export type NewInventoryHoldRow = typeof inventoryHolds.$inferInsert;
