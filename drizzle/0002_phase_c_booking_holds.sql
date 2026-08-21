CREATE TYPE "public"."financial_status" AS ENUM('OPEN', 'SETTLED', 'REFUNDING', 'REFUNDED', 'DISPUTED', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "public"."inventory_type" AS ENUM('property', 'experience');--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_number" text NOT NULL,
	"inquiry_id" text,
	"kind" "booking_kind" NOT NULL,
	"guest_id" text NOT NULL,
	"host_id" text NOT NULL,
	"property_id" text,
	"experience_id" text,
	"check_in" date,
	"check_out" date,
	"experience_date" timestamp with time zone,
	"guests_count" integer DEFAULT 1 NOT NULL,
	"units_count" integer DEFAULT 1 NOT NULL,
	"currency" char(3) DEFAULT 'INR' NOT NULL,
	"original_price_paise" bigint NOT NULL,
	"expected_guest_total_paise" bigint NOT NULL,
	"booking_status" "booking_status" DEFAULT 'PENDING_PAYMENT' NOT NULL,
	"payment_status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"payout_status" "payout_status" DEFAULT 'NOT_ELIGIBLE' NOT NULL,
	"financial_status" "financial_status" DEFAULT 'OPEN' NOT NULL,
	"cancellation_policy_type" "cancellation_policy",
	"cancellation_policy_snapshot" jsonb NOT NULL,
	"commission_bps" integer NOT NULL,
	"commission_rule_id" uuid,
	"commission_snapshot" jsonb NOT NULL,
	"gst_rate_bps" integer NOT NULL,
	"tax_rule_id" uuid,
	"tax_snapshot" jsonb NOT NULL,
	"hold_expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" "actor_kind",
	"expired_at" timestamp with time zone,
	"is_internal_inventory" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bookings_one_target_ck" CHECK ((
        ("bookings"."kind" = 'property' AND "bookings"."property_id" IS NOT NULL AND "bookings"."experience_id" IS NULL)
        OR
        ("bookings"."kind" = 'experience' AND "bookings"."experience_id" IS NOT NULL AND "bookings"."property_id" IS NULL)
      )),
	CONSTRAINT "bookings_dates_ck" CHECK ((
        ("bookings"."kind" = 'property' AND "bookings"."check_in" IS NOT NULL AND "bookings"."check_out" IS NOT NULL AND "bookings"."check_out" > "bookings"."check_in")
        OR
        ("bookings"."kind" = 'experience' AND "bookings"."experience_date" IS NOT NULL)
      )),
	CONSTRAINT "bookings_inr_only_ck" CHECK ("bookings"."currency" = 'INR')
);
--> statement-breakpoint
CREATE TABLE "inventory_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"inventory_type" "inventory_type" NOT NULL,
	"inventory_id" text NOT NULL,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone NOT NULL,
	"units_count" integer DEFAULT 1 NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"status" "inventory_hold_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"released_at" timestamp with time zone,
	"converted_at" timestamp with time zone,
	"expired_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "inventory_holds" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "inventory_holds" ALTER COLUMN "status" SET DEFAULT 'active'::text;--> statement-breakpoint
DROP TYPE "public"."inventory_hold_status";--> statement-breakpoint
CREATE TYPE "public"."inventory_hold_status" AS ENUM('active', 'expired', 'released', 'converted');--> statement-breakpoint
ALTER TABLE "inventory_holds" ALTER COLUMN "status" SET DEFAULT 'active'::"public"."inventory_hold_status";--> statement-breakpoint
ALTER TABLE "inventory_holds" ALTER COLUMN "status" SET DATA TYPE "public"."inventory_hold_status" USING "status"::"public"."inventory_hold_status";--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_inquiry_id_stored_inquiries_id_fk" FOREIGN KEY ("inquiry_id") REFERENCES "public"."stored_inquiries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_guest_id_users_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_property_id_properties_slug_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_experience_id_experiences_slug_fk" FOREIGN KEY ("experience_id") REFERENCES "public"."experiences"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_holds" ADD CONSTRAINT "inventory_holds_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_number_uq" ON "bookings" USING btree ("booking_number");--> statement-breakpoint
CREATE INDEX "bookings_guest_idx" ON "bookings" USING btree ("guest_id");--> statement-breakpoint
CREATE INDEX "bookings_host_idx" ON "bookings" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "bookings_property_idx" ON "bookings" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "bookings_experience_idx" ON "bookings" USING btree ("experience_id");--> statement-breakpoint
CREATE INDEX "bookings_booking_status_idx" ON "bookings" USING btree ("booking_status");--> statement-breakpoint
CREATE INDEX "bookings_payment_status_idx" ON "bookings" USING btree ("payment_status");--> statement-breakpoint
CREATE INDEX "bookings_check_in_idx" ON "bookings" USING btree ("check_in");--> statement-breakpoint
CREATE INDEX "inventory_holds_booking_idx" ON "inventory_holds" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "inventory_holds_inventory_idx" ON "inventory_holds" USING btree ("inventory_type","inventory_id");--> statement-breakpoint
CREATE INDEX "inventory_holds_status_idx" ON "inventory_holds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "inventory_holds_expires_idx" ON "inventory_holds" USING btree ("expires_at");--> statement-breakpoint
-- Phase C hand-additions (not expressible via Drizzle schema):
-- 1) btree_gist enables GiST indexing of scalar (=) alongside range (&&).
CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
-- 2) Concurrency-safe, monotonic booking-number sequence (ES-YYYYMMDD-NNNNNN).
CREATE SEQUENCE IF NOT EXISTS "booking_number_seq" START WITH 1 INCREMENT BY 1;--> statement-breakpoint
-- 3) Server-side availability guard: no two BLOCKING (active|converted) holds
--    for the same PROPERTY may overlap in [start_date, end_date). Experiences
--    are capacity-based and intentionally excluded from this constraint.
ALTER TABLE "inventory_holds"
  ADD CONSTRAINT "inventory_holds_no_property_overlap"
  EXCLUDE USING gist (
    "inventory_id" WITH =,
    tstzrange("start_date", "end_date") WITH &&
  )
  WHERE (status IN ('active','converted') AND inventory_type = 'property');
