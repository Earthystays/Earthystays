CREATE TYPE "public"."actor_kind" AS ENUM('guest', 'host', 'admin', 'system');--> statement-breakpoint
CREATE TYPE "public"."adjustment_status" AS ENUM('pending', 'applied', 'settled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."adjustment_type" AS ENUM('host_cancellation_penalty', 'guest_compensation', 'goodwill', 'clawback', 'correction', 'overpayment', 'post_payout_recovery');--> statement-breakpoint
CREATE TYPE "public"."admin_role" AS ENUM('SUPER_ADMIN', 'FINANCE_ADMIN', 'OPERATIONS_ADMIN');--> statement-breakpoint
CREATE TYPE "public"."bank_verification_status" AS ENUM('unverified', 'pending', 'verified', 'failed');--> statement-breakpoint
CREATE TYPE "public"."booking_kind" AS ENUM('property', 'experience');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'CHECKED_IN', 'COMPLETED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."cancellation_policy" AS ENUM('flexible', 'moderate', 'strict');--> statement-breakpoint
CREATE TYPE "public"."commission_scope" AS ENUM('global', 'category', 'host', 'property', 'experience', 'promotional', 'booking_override');--> statement-breakpoint
CREATE TYPE "public"."dispute_resolution" AS ENUM('guest_favor', 'host_favor', 'split', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."dispute_source" AS ENUM('guest_complaint', 'gateway_chargeback', 'admin_created');--> statement-breakpoint
CREATE TYPE "public"."dispute_status" AS ENUM('open', 'under_review', 'awaiting_evidence', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('individual', 'sole_proprietor', 'partnership', 'llp', 'private_limited', 'internal');--> statement-breakpoint
CREATE TYPE "public"."inventory_hold_status" AS ENUM('active', 'consumed', 'expired', 'released');--> statement-breakpoint
CREATE TYPE "public"."kyc_status" AS ENUM('pending', 'submitted', 'under_review', 'verified', 'rejected', 'action_required');--> statement-breakpoint
CREATE TYPE "public"."ledger_account" AS ENUM('guest_cash', 'gateway_clearing', 'gateway_fee_expense', 'earthy_commission_revenue', 'host_payable_liability', 'host_payout_clearing', 'refund_payable', 'gst_payable', 'adjustment_expense', 'adjustment_income', 'dispute_hold', 'internal_inventory_equity');--> statement-breakpoint
CREATE TYPE "public"."ledger_direction" AS ENUM('debit', 'credit');--> statement-breakpoint
CREATE TYPE "public"."ledger_event_type" AS ENUM('payment_captured', 'gateway_fee', 'commission_recognized', 'gst_recognized', 'refund_issued', 'commission_reversed', 'payout_scheduled', 'payout_paid', 'payout_reversed', 'adjustment_credit', 'adjustment_debit', 'dispute_hold', 'dispute_release');--> statement-breakpoint
CREATE TYPE "public"."listing_status" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."onboarding_status" AS ENUM('not_started', 'in_progress', 'submitted', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."payment_attempt_status" AS ENUM('created', 'pending', 'authorized', 'captured', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('UNPAID', 'PROCESSING', 'PAID', 'FAILED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."payout_status" AS ENUM('NOT_ELIGIBLE', 'ON_HOLD', 'ELIGIBLE', 'PROCESSING', 'PAID', 'FAILED', 'REVERSED', 'ADJUSTED');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('villa', 'apartment', 'hotel', 'hostel');--> statement-breakpoint
CREATE TYPE "public"."refund_status" AS ENUM('pending', 'processing', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."refund_trigger" AS ENUM('cancellation', 'host_cancellation', 'manual', 'dispute', 'overpayment');--> statement-breakpoint
CREATE TYPE "public"."refund_type" AS ENUM('full', 'partial');--> statement-breakpoint
CREATE TYPE "public"."tax_category" AS ENUM('accommodation', 'experience', 'service', 'other');--> statement-breakpoint
CREATE TYPE "public"."tax_comparator" AS ENUM('lte', 'gt');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('guest', 'host', 'admin', 'internal');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'suspended', 'deactivated');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"full_name" text NOT NULL,
	"role" "user_role" DEFAULT 'guest' NOT NULL,
	"is_host" boolean DEFAULT false NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"is_internal" boolean DEFAULT false NOT NULL,
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_is_host_idx" ON "users" USING btree ("is_host");