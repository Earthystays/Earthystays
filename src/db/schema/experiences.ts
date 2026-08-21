/**
 * experiences — host-led experience listing (existing data/experiences.json).
 *
 * Phase 1B.5 Phase B. CRITICAL (spec §22): the legacy `hostId` (e.g.
 * "host_prateek") references an ExperienceHost MARKETING PERSONA, which is NOT
 * a financial payout entity. We therefore split the two concepts:
 *   • `host_persona_id` (text) — kept for presentation, references the legacy
 *     experience-hosts marketing record. NOT a foreign key to users.
 *   • `host_user_id` (text, nullable FK → users) — the REAL payout user. Left
 *     null during migration because the legacy data does not support a
 *     confident mapping; every such experience is listed in the migration
 *     report under "experiences requiring manual host review".
 *
 * We never invent a host_user_id where the source data does not support one.
 */
import { bigint, index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./_shared";
import { listingStatus } from "./enums";
import { users } from "./users";

export const experiences = pgTable(
  "experiences",
  {
    /** Preserved from JSON — the existing experience `slug`. */
    slug: text("slug").primaryKey(),

    /** Marketing persona id (presentation only). NOT a payout entity, NOT an FK. */
    hostPersonaId: text("host_persona_id"),

    /** Real payout user. Null until an admin confidently maps it. */
    hostUserId: text("host_user_id").references(() => users.id),

    name: text("name").notNull(),

    /** From experience.priceFrom, in integer paise. */
    priceFromPaise: bigint("price_from_paise", { mode: "number" }),
    currency: text("currency").notNull().default("INR"),

    /**
     * Legacy experience.cancellationPolicy is FREE TEXT, not a preset, so we
     * keep the original string here and leave the structured enum unset. A real
     * flexible/moderate/strict policy is assigned in a later phase.
     */
    cancellationPolicyText: text("cancellation_policy_text"),

    citySlug: text("city_slug"),
    city: text("city"),
    state: text("state"),

    /** Legacy status is free text (e.g. "published"); mapped best-effort. */
    status: listingStatus("status").notNull().default("active"),

    raw: jsonb("raw").notNull(),

    sourceFile: text("source_file").notNull().default("experiences.json"),
    importedAt: timestamp("imported_at", { withTimezone: true }),

    createdAt,
    updatedAt,
  },
  (t) => [
    index("experiences_host_user_idx").on(t.hostUserId),
    index("experiences_host_persona_idx").on(t.hostPersonaId),
    index("experiences_status_idx").on(t.status),
    index("experiences_city_idx").on(t.citySlug),
  ],
);

export type ExperienceRow = typeof experiences.$inferSelect;
export type NewExperienceRow = typeof experiences.$inferInsert;
