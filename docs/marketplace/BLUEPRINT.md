# Earthy Stays — Marketplace Blueprint (v1, for approval)

**Date:** 2026-07-15 · **Status:** awaiting owner approval — no implementation yet
**Full document (diagrams, wireframes, ERD):** https://claude.ai/code/artifact/53fa71a5-053a-4f20-b502-40b46eb44afc

## Prime directive

The public site does not change. Homepage, listings, property pages, search, filters,
collections stay pixel-identical. The marketplace is built behind them: host dashboard,
booking-request pipeline, approval queue inside the existing admin, real database underneath.

## What we reuse (already in this codebase)

- Auth: email+password AND Google OAuth, `es-user` cookie sessions → add `roles`, mode picker. Phone OTP = Phase 2.
- Wishlist: done (`User.wishlist`, `/api/wishlist/[slug]`).
- Admin panel `/admin/(dashboard)`: becomes the Admin Panel; add Approvals, Bookings, Hosts, Messages.
- Villa form + autosave drafts + PhotoUploader + amenity picker: the 9-step host wizard wraps these exact field groups.
- Inquiries, reviews, villa-views, WhatsApp tracking: seed booking requests, reviews module, host analytics.
- Design tokens in `globals.css`: host + admin surfaces consume them; zero new visual language.

## Load-bearing decisions

1. **Phase 0 prerequisite:** migrate JSON files → SQLite via Drizzle ORM (Postgres-compatible schema).
   One-shot script imports `villas.json`, `users.json`, `inquiries.json`, `amenities.json`.
   Site must render pixel-identical from DB before anything else merges.
2. **One user, many roles:** `roles: [traveller|host|ops|super_admin]` (finance/marketing reserved).
   Airbnb-style travelling/hosting mode switch in account menu.
3. **Property = current Villa model, extended:** `hostId`, `status`, `managedBy`, `category` (16 types),
   pricing (base/weekend/extra-guest/cleaning/deposit, integer paise), rules. Public queries add
   `WHERE status='approved'` — that's why the frontend doesn't change.
4. **Status machine:** draft → pending_review → approved/rejected, + host-controlled hidden.
   Nothing goes live without review; edits to approved listings re-enter review with field diff.
5. **Booking requests:** own table (not inquiries). Fan out to host AND ops simultaneously;
   host accepts/rejects, ops always retains override and does final confirmation offline.
6. **Messaging:** text-only threads, polling not websockets, scoped to property/booking request.
7. **Managed by Earthy Stays** = `managedBy: "earthy" | "self"` attribute → premium badge,
   priority support, Premium Collection eligibility. All existing villas start as earthy+approved.
8. **Frontend footprint (complete list):** nav "Become a Host" link; "Request Booking" as primary
   action on existing inquiry form; "Managed by Earthy Stays" pill; mode switch + bell in account
   menu; one role-choice screen after first sign-in; "Hosted by" line on self-hosted properties only.

## Schema (core tables)

users, host_profiles, host_verifications (email/phone/gov_id/pan/bank docs),
properties, property_images, availability_blocks (blocked|booked), booking_requests,
threads, messages, reviews (+replies, two-way), wishlists, notifications, audit_logs,
categories, amenities, locations tree, collections (+join), experiences (+join), inquiries.
Payments/payouts/coupons/pricing_rules: reserved names, no tables until Phase 3.

## New routes

- `/become-a-host`, `/host/*` (overview, properties+wizard, bookings, calendar, messages,
  reviews, analytics, verification, settings, payouts-coming-soon, support)
- `/admin/(dashboard)/{approvals,bookings,hosts,messages}` (extends existing admin)
- API: `/api/host/*`, `/api/booking-requests`, `/api/messages/*`, `/api/notifications`,
  `/api/admin/{approvals,bookings,hosts,...}` — full table in the artifact.
- `lib/db/` (Drizzle), `lib/auth/permissions.ts` (single role→ability map), `lib/notify.ts`
  (in-app + Resend), `components/{host,shared}/`, `scripts/migrate-json-to-db.ts`.

## Roadmap

- **Phase 0 (~1–2 wk):** DB migration, roles/permissions, gated layouts, pixel-parity check.
- **Phase 1 (~5–7 wk):** Become a Host + wizard + preview; approval queue with diff;
  booking requests end-to-end; calendar block/open; messaging; notifications; verification
  uploads (manual review); host analytics v1; reviews v1; audit log.
  *Exit criteria:* stranger signs up → lists → approved → receives request → accepts → ops confirms,
  with no code or JSON edits.
- **Phase 2 (~4–6 wk):** phone OTP (MSG91), two-way reviews, host profiles, listing-quality score,
  iCal sync (Airbnb/Booking/Google), richer analytics, SLA nudges.
- **Phase 3:** Razorpay (UPI/cards/wallets), instant book, payouts + Finance role, coupons,
  dynamic pricing, featured placements, referrals.

## Open decisions for the owner

1. SQLite-on-VPS now (recommended) vs managed Postgres now.
2. SMS/OTP provider — recommend MSG91, deferred to Phase 2.
3. Host terms page needed before Phase 1 launch; commission % can wait for Phase 3.
4. Review SLA: ops within 24h; super admin handles escalations.
5. WhatsApp CTA on self-hosted properties? Recommend no — keep it a managed-tier perk.
