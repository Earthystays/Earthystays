CREATE TABLE "properties" (
	"slug" text PRIMARY KEY NOT NULL,
	"host_id" text,
	"name" text NOT NULL,
	"type" "property_type" DEFAULT 'villa' NOT NULL,
	"base_nightly_price_paise" bigint,
	"currency" text DEFAULT 'INR' NOT NULL,
	"cancellation_policy" "cancellation_policy",
	"destination_slug" text,
	"city" text,
	"state" text,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"raw" jsonb NOT NULL,
	"source_file" text DEFAULT 'villas.json' NOT NULL,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "experiences" (
	"slug" text PRIMARY KEY NOT NULL,
	"host_persona_id" text,
	"host_user_id" text,
	"name" text NOT NULL,
	"price_from_paise" bigint,
	"currency" text DEFAULT 'INR' NOT NULL,
	"cancellation_policy_text" text,
	"city_slug" text,
	"city" text,
	"state" text,
	"status" "listing_status" DEFAULT 'active' NOT NULL,
	"raw" jsonb NOT NULL,
	"source_file" text DEFAULT 'experiences.json' NOT NULL,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stored_inquiries" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" text,
	"name" text,
	"phone" text,
	"guests" text,
	"message" text,
	"experience_ref" text,
	"status" text,
	"booking_id" text,
	"raw" jsonb NOT NULL,
	"source_file" text DEFAULT 'inquiries.json' NOT NULL,
	"imported_at" timestamp with time zone,
	"legacy_created_at" timestamp with time zone,
	"legacy_updated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text,
	"provider_account_id" text,
	"legal_name" text,
	"entity_type" "entity_type",
	"pan" text,
	"gstin" text,
	"is_internal" boolean DEFAULT false NOT NULL,
	"onboarding_status" "onboarding_status" DEFAULT 'not_started' NOT NULL,
	"kyc_status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"payout_eligible" boolean DEFAULT false NOT NULL,
	"imported_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kyc_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_account_id" uuid NOT NULL,
	"status" "kyc_status" DEFAULT 'pending' NOT NULL,
	"legal_name" text,
	"pan" text,
	"gstin" text,
	"mobile" text,
	"email" text,
	"address" text,
	"business_info" text,
	"document_refs" jsonb,
	"provider_ref" text,
	"submitted_at" timestamp with time zone,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	"rejection_reason" text,
	"action_required_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bank_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_account_id" uuid NOT NULL,
	"account_holder_name" text NOT NULL,
	"account_ref" text NOT NULL,
	"account_last4" text NOT NULL,
	"ifsc" text NOT NULL,
	"verification_status" "bank_verification_status" DEFAULT 'unverified' NOT NULL,
	"provider_verification_ref" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"effective_from" timestamp with time zone DEFAULT now() NOT NULL,
	"effective_to" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_host_id_users_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_host_user_id_users_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_accounts" ADD CONSTRAINT "payment_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_payment_account_id_payment_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kyc_records" ADD CONSTRAINT "kyc_records_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bank_accounts" ADD CONSTRAINT "bank_accounts_payment_account_id_payment_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."payment_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_host_idx" ON "properties" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "properties_type_idx" ON "properties" USING btree ("type");--> statement-breakpoint
CREATE INDEX "properties_status_idx" ON "properties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "properties_destination_idx" ON "properties" USING btree ("destination_slug");--> statement-breakpoint
CREATE INDEX "experiences_host_user_idx" ON "experiences" USING btree ("host_user_id");--> statement-breakpoint
CREATE INDEX "experiences_host_persona_idx" ON "experiences" USING btree ("host_persona_id");--> statement-breakpoint
CREATE INDEX "experiences_status_idx" ON "experiences" USING btree ("status");--> statement-breakpoint
CREATE INDEX "experiences_city_idx" ON "experiences" USING btree ("city_slug");--> statement-breakpoint
CREATE INDEX "stored_inquiries_kind_idx" ON "stored_inquiries" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "stored_inquiries_status_idx" ON "stored_inquiries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "stored_inquiries_booking_idx" ON "stored_inquiries" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_accounts_user_uq" ON "payment_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "payment_accounts_kyc_idx" ON "payment_accounts" USING btree ("kyc_status");--> statement-breakpoint
CREATE INDEX "payment_accounts_eligible_idx" ON "payment_accounts" USING btree ("payout_eligible");--> statement-breakpoint
CREATE INDEX "kyc_records_account_idx" ON "kyc_records" USING btree ("payment_account_id");--> statement-breakpoint
CREATE INDEX "kyc_records_status_idx" ON "kyc_records" USING btree ("status");--> statement-breakpoint
CREATE INDEX "bank_accounts_account_idx" ON "bank_accounts" USING btree ("payment_account_id");--> statement-breakpoint
CREATE INDEX "bank_accounts_verification_idx" ON "bank_accounts" USING btree ("verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "bank_accounts_one_primary_uq" ON "bank_accounts" USING btree ("payment_account_id") WHERE "bank_accounts"."is_primary" AND "bank_accounts"."effective_to" IS NULL;