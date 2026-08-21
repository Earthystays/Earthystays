CREATE TYPE "public"."discrepancy_type" AS ENUM('WRONG_AMOUNT', 'OVERPAYMENT', 'UNDERPAYMENT', 'CURRENCY_MISMATCH');--> statement-breakpoint
CREATE TYPE "public"."payment_kind" AS ENUM('full', 'advance', 'balance');--> statement-breakpoint
-- Recreate the (previously unused) payment_attempt_status enum with the Phase D
-- vocabulary BEFORE any table references it. Safe: no table uses it yet.
DROP TYPE "public"."payment_attempt_status";--> statement-breakpoint
CREATE TYPE "public"."payment_attempt_status" AS ENUM('CREATED', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "gateway_webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gateway" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text,
	"booking_id" uuid,
	"payment_attempt_id" uuid,
	"payload" jsonb,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"booking_id" uuid NOT NULL,
	"attempt_no" smallint NOT NULL,
	"provider" text NOT NULL,
	"gateway_order_id" text,
	"gateway_payment_id" text,
	"amount_paise" bigint NOT NULL,
	"currency" char(3) DEFAULT 'INR' NOT NULL,
	"gateway_fee_paise" bigint DEFAULT 0 NOT NULL,
	"status" "payment_attempt_status" DEFAULT 'CREATED' NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"idempotency_key" text NOT NULL,
	"request_id" text,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payment_discrepancies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"payment_id" uuid,
	"payment_attempt_id" uuid,
	"type" "discrepancy_type" NOT NULL,
	"expected_amount_paise" bigint NOT NULL,
	"provider_amount_paise" bigint NOT NULL,
	"expected_currency" char(3) NOT NULL,
	"provider_currency" char(3) NOT NULL,
	"gateway_payment_id" text,
	"note" text,
	"resolved" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"kind" "payment_kind" DEFAULT 'full' NOT NULL,
	"amount_paise" bigint NOT NULL,
	"currency" char(3) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'UNPAID' NOT NULL,
	"provider" text,
	"gateway_payment_id" text,
	"gateway_fee_paise" bigint DEFAULT 0 NOT NULL,
	"succeeded_attempt_id" uuid,
	"idempotency_key" text NOT NULL,
	"failure_code" text,
	"failure_message" text,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gateway_webhook_events" ADD CONSTRAINT "gateway_webhook_events_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gateway_webhook_events" ADD CONSTRAINT "gateway_webhook_events_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_attempts" ADD CONSTRAINT "payment_attempts_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_discrepancies" ADD CONSTRAINT "payment_discrepancies_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_discrepancies" ADD CONSTRAINT "payment_discrepancies_payment_id_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."payments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_discrepancies" ADD CONSTRAINT "payment_discrepancies_payment_attempt_id_payment_attempts_id_fk" FOREIGN KEY ("payment_attempt_id") REFERENCES "public"."payment_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "gateway_webhook_events_uq" ON "gateway_webhook_events" USING btree ("gateway","event_id");--> statement-breakpoint
CREATE INDEX "gateway_webhook_events_booking_idx" ON "gateway_webhook_events" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_payment_idx" ON "payment_attempts" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_booking_idx" ON "payment_attempts" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_attempts_status_idx" ON "payment_attempts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_idem_uq" ON "payment_attempts" USING btree ("idempotency_key");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_gateway_payment_uq" ON "payment_attempts" USING btree ("gateway_payment_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payment_attempts_payment_attemptno_uq" ON "payment_attempts" USING btree ("payment_id","attempt_no");--> statement-breakpoint
CREATE INDEX "payment_discrepancies_booking_idx" ON "payment_discrepancies" USING btree ("booking_id");--> statement-breakpoint
CREATE INDEX "payment_discrepancies_resolved_idx" ON "payment_discrepancies" USING btree ("resolved");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_booking_uq" ON "payments" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idem_uq" ON "payments" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "payments_status_idx" ON "payments" USING btree ("status");