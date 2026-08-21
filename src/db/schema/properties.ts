/**
 * properties — the villa/apartment/hotel/hostel listing (existing Villa data).
 *
 * Phase 1B.5 Phase B. Source of truth for legacy fields is data/villas.json
 * and src/lib/types.ts. Legacy villas have NO `id` and NO `hostId` — they are
 * keyed by `slug` and carry no host relationship, i.e. they are effectively
 * Earthy-owned inventory. We therefore:
 *   • use the existing `slug` as the primary key (text, preserved 1:1);
 *   • keep `host_id` nullable (null legacy rows are flagged for review and can
 *     later be assigned to the internal Earthy entity);
 *   • store the full original record in `raw` (jsonb) so nothing is lost and the
 *     migration is reversible.
 *
 * Financial booking logic is NOT implemented here (Phase C+).
 */
import { bigint, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./_shared";
import { cancellationPolicy, listingStatus, propertyType } from "./enums";
import { users } from "./users";

export const properties = pgTable(
  "properties",
  {
    /** Preserved from JSON — the existing villa `slug` (e.g. "oceanview-villa-candolim-beach"). */
    slug: text("slug").primaryKey(),

    /** Nullable: legacy villas have no host. Null = Earthy-owned / needs review. */
    hostId: text("host_id").references(() => users.id),

    name: text("name").notNull(),
    type: propertyType("type").notNull().default("villa"),

    /** List price per night in integer paise (GST-EXCLUSIVE, per business rules). */
    baseNightlyPricePaise: bigint("base_nightly_price_paise", { mode: "number" }),
    currency: text("currency").notNull().default("INR"),

    /** From villa.cancellationPolicy.preset. Null when the legacy record had none. */
    cancellationPolicy: cancellationPolicy("cancellation_policy"),

    destinationSlug: text("destination_slug"),
    city: text("city"),
    state: text("state"),

    status: listingStatus("status").notNull().default("active"),

    /** Full original JSON record — lossless, for fidelity and reversibility. */
    raw: jsonb("raw").notNull(),

    /** Provenance: which JSON file and when it was imported. */
    sourceFile: text("source_file").notNull().default("villas.json"),
    importedAt: timestamp("imported_at", { withTimezone: true }),

    createdAt,
    updatedAt,
  },
  (t) => [
    index("properties_host_idx").on(t.hostId),
    index("properties_type_idx").on(t.type),
    index("properties_status_idx").on(t.status),
    index("properties_destination_idx").on(t.destinationSlug),
  ],
);

export type PropertyRow = typeof properties.$inferSelect;
export type NewPropertyRow = typeof properties.$inferInsert;
