/**
 * stored_inquiries — the existing lead/inquiry record (data/inquiries.json).
 *
 * Phase 1B.5 Phase B. This STAYS a lead record. CRITICAL: a legacy inquiry with
 * status "booked" is NOT a real financial Booking and is never converted into
 * one by the migration. `booking_id` is nullable and remains null during
 * migration — it is only populated later, when a real Booking (Phase C) is
 * created and explicitly linked.
 *
 * The legacy `status` and `kind` vocabularies are free-form ("open", "new",
 * "booked", "closed", "shared" / "experience", "guest", "callback", undefined),
 * so they are preserved verbatim as text rather than forced into an enum.
 */
import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createdAt, updatedAt } from "./_shared";

export const storedInquiries = pgTable(
  "stored_inquiries",
  {
    /** Preserved from JSON, e.g. "inq_1784969312182_suvzbq". */
    id: text("id").primaryKey(),

    /** Legacy free-form kind: experience | guest | callback | (null). */
    kind: text("kind"),

    name: text("name"),
    phone: text("phone"),
    guests: text("guests"), // legacy stores mixed types; kept loose

    message: text("message"),

    /** Legacy soft references (slugs / labels) — kept as-is, not FKs. */
    experienceRef: text("experience_ref"),

    /** Legacy lead status: open | new | booked | closed | shared. */
    status: text("status"),

    /**
     * Nullable link to a REAL Booking. Always null after Phase B migration; a
     * legacy "booked" status does NOT populate this. Wired up in Phase C.
     */
    bookingId: text("booking_id"),

    raw: jsonb("raw").notNull(),

    sourceFile: text("source_file").notNull().default("inquiries.json"),
    importedAt: timestamp("imported_at", { withTimezone: true }),

    /** Legacy createdAt/updatedAt preserved from source where present. */
    legacyCreatedAt: timestamp("legacy_created_at", { withTimezone: true }),
    legacyUpdatedAt: timestamp("legacy_updated_at", { withTimezone: true }),

    createdAt,
    updatedAt,
  },
  (t) => [
    index("stored_inquiries_kind_idx").on(t.kind),
    index("stored_inquiries_status_idx").on(t.status),
    index("stored_inquiries_booking_idx").on(t.bookingId),
  ],
);

export type StoredInquiryRow = typeof storedInquiries.$inferSelect;
export type NewStoredInquiryRow = typeof storedInquiries.$inferInsert;
