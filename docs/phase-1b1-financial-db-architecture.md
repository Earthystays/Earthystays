# Phase 1B.1 — Earthy Stays Financial Database Architecture

**Status:** Design specification (no code, no migrations)
**Stack:** PostgreSQL + Drizzle ORM
**Currency (V1):** INR only
**Date:** 2026-08-21

---

## 0. Design Principles

1. **Separation of state.** No single `status` column. Every entity distinguishes, where relevant:
   - **operational state** — what is physically happening (booking lifecycle, stay progress)
   - **payment state** — how much money has been collected from the guest
   - **payout state** — money owed to and disbursed to the host
   - **financial state** — the accounting truth (immutable ledger)
2. **Immutable financial history.** `LedgerEntry`, `Payment`, `Refund`, `Payout`, `Adjustment` rows are **append-only**. Nothing that touches money is ever `UPDATE`d in a way that rewrites value or `DELETE`d. Corrections are new rows (reversals / adjustments).
3. **Snapshot at confirmation.** Commission rate, cancellation policy, and tax classification are **copied onto the booking** when it is confirmed. Later rule changes never rewrite historical bookings.
4. **Double-entry ledger is the source of truth.** `BookingFinancial` is a fast, mutable *derived snapshot*; the ledger is the authoritative history. All money movement flows through a single conceptual `postJournal()` boundary.
5. **Idempotent gateway integration.** Every webhook and gateway reference is deduplicated via unique constraints.
6. **Everything auditable.** Every financial or admin mutation writes an `AuditLog` row.
7. **Internal inventory is modeled like a host.** Earthy-owned properties reference an internal Earthy `User` + `PaymentAccount` so the ledger always balances (commission = 100% retained, host-payable = 0 or internal transfer).

**Money representation.** All monetary amounts are stored as `bigint` in **paise** (₹1 = 100 paise), never floating point. Rates/percentages are stored as `integer` **basis points** (15% = 1500 bps). `currency` is `char(3)` defaulting to `'INR'`, present on every money-bearing table for future multi-currency.

**IDs.** Every PK is `uuid` (default `gen_random_uuid()`) unless noted. Human-facing references (booking number, journal id) are separate `text` columns with their own unique constraint.

**Timestamps.** `timestamptz` everywhere, UTC. Every table has `created_at` (default `now()`); mutable tables also have `updated_at`.

---

## 1. User

- **Purpose:** Person or entity in the system — guest, host, admin, or the internal Earthy entity. Extends the existing user concept; does **not** replace it.
- **Table:** `users`
- **PK:** `id uuid`
- **Mutable:** Yes (profile fields). Role flags mutable by admin only.
- **Never delete:** Users referenced by any booking/ledger row — soft-deactivate instead.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| email | citext | ✔ | — | **unique** |
| phone | text | ○ | — | unique (nullable) |
| full_name | text | ✔ | — | |
| role | enum `user_role` | ✔ | 'guest' | see enum |
| is_host | boolean | ✔ | false | admin-gated (existing rule) |
| is_admin | boolean | ✔ | false | |
| is_internal | boolean | ✔ | false | true = Earthy internal entity |
| status | enum `user_status` | ✔ | 'active' | operational |
| created_at | timestamptz | ✔ | now() | |
| updated_at | timestamptz | ✔ | now() | |

- **Enums:** `user_role` = {guest, host, admin, internal}. `user_status` = {active, suspended, deactivated}.
- **FKs:** none outbound (root entity).
- **Unique:** email; phone (nullable).
- **Indexes:** `(email)`, `(is_host) WHERE is_host`, `(role)`.
- **Created by:** signup / admin creation / seed (internal entity).
- **Updated by:** self (profile), admin (roles/status).
- **Relationships:** 1—N Property, Experience, Booking (as guest), Booking (as host); 1—1 PaymentAccount (hosts + internal).

---

## 2. Property

- **Purpose:** A villa/apartment/stay listing (existing concept). Financial fields are additive; listing content stays as-is.
- **Table:** `properties`
- **PK:** `id uuid`
- **Mutable:** Yes.
- **Never delete:** Listings with bookings — archive via `status`.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| host_id | uuid | ✔ | — | FK → users.id (host or internal) |
| slug | text | ✔ | — | unique |
| title | text | ✔ | — | |
| type | enum `property_type` | ✔ | 'villa' | villa/apartment/stay/hostel/hotel |
| base_nightly_price | bigint | ✔ | — | paise, per unit per day (list price) |
| currency | char(3) | ✔ | 'INR' | |
| is_internal_inventory | boolean | ✔ | false | Earthy-owned |
| cancellation_policy | enum `cancellation_policy` | ✔ | 'moderate' | host default; snapshotted at booking |
| commission_rule_id | uuid | ○ | — | FK → commission_rules.id (property-level override) |
| status | enum `listing_status` | ✔ | 'draft' | operational |
| created_at | timestamptz | ✔ | now() | |
| updated_at | timestamptz | ✔ | now() | |

- **Enums:** `property_type` = {villa, apartment, stay, hostel, hotel}. `cancellation_policy` = {flexible, moderate, strict}. `listing_status` = {draft, active, paused, archived}.
- **FKs:** host_id → users; commission_rule_id → commission_rules.
- **Unique:** slug.
- **Indexes:** `(host_id)`, `(status)`, `(type)`.
- **Created by:** host/admin. **Updated by:** host/admin.
- **Relationships:** N—1 User (host); 1—N Booking.

> Note: per-unit-per-day pricing and unit inventory (`units[]`) from the hotel/hostel expansion remain on the property; GST is evaluated **per unit per day** against `base_nightly_price` (see TaxRule).

---

## 3. Experience

- **Purpose:** Host-led experience listing (existing module). 15% commission, payout after completion.
- **Table:** `experiences`
- **PK:** `id uuid`
- **Mutable:** Yes. **Never delete:** with bookings — archive.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| host_id | uuid | ✔ | — | FK → users.id |
| slug | text | ✔ | — | unique |
| title | text | ✔ | — | |
| price_per_participant | bigint | ✔ | — | paise |
| currency | char(3) | ✔ | 'INR' | |
| is_internal_inventory | boolean | ✔ | false | |
| cancellation_policy | enum `cancellation_policy` | ✔ | 'moderate' | |
| commission_rule_id | uuid | ○ | — | FK (experience-level override) |
| status | enum `listing_status` | ✔ | 'draft' | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **FKs:** host_id → users; commission_rule_id → commission_rules.
- **Unique:** slug. **Indexes:** `(host_id)`, `(status)`.
- **Relationships:** N—1 User; 1—N Booking.

---

## 4. Booking

- **Purpose:** The real commercial booking — a **new entity, separate from `StoredInquiry`** (which stays as the lead/inquiry record). Represents either a property stay OR an experience. **Not** the financial ledger.
- **Table:** `bookings`
- **PK:** `id uuid`
- **Mutable:** Yes, but snapshot fields are write-once at confirmation.
- **Never delete:** ever — cancellations are a status transition.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_number | text | ✔ | — | human ref, **unique** |
| inquiry_id | uuid | ○ | — | FK → stored_inquiries.id (originating lead) |
| kind | enum `booking_kind` | ✔ | — | property \| experience |
| guest_id | uuid | ✔ | — | FK → users.id |
| host_id | uuid | ✔ | — | FK → users.id (denormalized at confirm) |
| property_id | uuid | ○ | — | FK → properties.id (required if kind=property) |
| experience_id | uuid | ○ | — | FK → experiences.id (required if kind=experience) |
| check_in | date | ○ | — | property only |
| check_out | date | ○ | — | property only |
| experience_date | timestamptz | ○ | — | experience only |
| guests_count | integer | ✔ | 1 | guests or participants |
| units_count | integer | ○ | 1 | property units booked |
| currency | char(3) | ✔ | 'INR' | |
| original_price | bigint | ✔ | — | paise, list total before discount/tax |
| **cancellation_policy_snapshot** | enum `cancellation_policy` | ✔ | — | copied at confirmation, immutable |
| **cancellation_terms_snapshot** | jsonb | ✔ | — | the concrete refund tiers in force |
| **commission_rule_id_snapshot** | uuid | ✔ | — | FK, resolved rule at confirm |
| **commission_bps_snapshot** | integer | ✔ | — | e.g. 1500, immutable |
| operational_status | enum `booking_op_status` | ✔ | 'draft' | lifecycle |
| payment_status | enum `booking_payment_status` | ✔ | 'unpaid' | derived from Payments |
| confirmed_at | timestamptz | ○ | — | set once |
| checked_in_at / checked_out_at | timestamptz | ○ | — | stays |
| completed_at | timestamptz | ○ | — | experiences |
| cancelled_at | timestamptz | ○ | — | |
| cancelled_by | enum `actor_kind` | ○ | — | guest \| host \| admin \| system |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:**
  - `booking_kind` = {property, experience}
  - `booking_op_status` = {draft, pending_confirmation, confirmed, in_progress, completed, cancelled, expired}
  - `booking_payment_status` = {unpaid, advance_paid, fully_paid, refunded_partial, refunded_full, in_dispute}
  - `actor_kind` = {guest, host, admin, system}
- **FKs:** inquiry_id, guest_id, host_id, property_id, experience_id, commission_rule_id_snapshot.
- **Unique:** booking_number.
- **Check constraints:** exactly one of (property_id, experience_id) non-null matching `kind`; property bookings require check_in/check_out; experience bookings require experience_date.
- **Indexes:** `(guest_id)`, `(host_id)`, `(property_id)`, `(experience_id)`, `(operational_status)`, `(payment_status)`, `(check_in)`, `(confirmed_at)`.
- **Immutable after confirm:** all `*_snapshot` fields, kind, guest_id, host_id, property/experience id, original_price.
- **Created by:** conversion from inquiry / direct booking flow. **Updated by:** payment engine (payment_status), operations (operational_status transitions), admin.
- **Relationships:** 1—N PaymentSchedule, Payment, Refund, Adjustment, Dispute, LedgerEntry; 1—1 BookingFinancial; 0/1—1 Payout.

---

## 5. PaymentSchedule

- **Purpose:** The plan of *what is owed and when*. Encodes the 50/50 rule and the <7-day 100% rule. Distinct from `Payment` (actual attempts).
- **Table:** `payment_schedules`
- **PK:** `id uuid`
- **Mutable:** installment `state` and `paid_amount` mutable; amounts/due dates fixed at confirmation (may be rewritten only by a documented reschedule that writes AuditLog).

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id |
| installment_no | smallint | ✔ | — | 1 = advance, 2 = balance |
| kind | enum `installment_kind` | ✔ | — | advance \| balance \| full |
| amount_due | bigint | ✔ | — | paise |
| currency | char(3) | ✔ | 'INR' | |
| due_at | timestamptz | ✔ | — | balance = check_in − 7d |
| paid_amount | bigint | ✔ | 0 | rolled up from successful Payments |
| state | enum `installment_state` | ✔ | 'pending' | payment state of this installment |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `installment_kind` = {advance, balance, full}. `installment_state` = {pending, due, paid, overdue, waived, cancelled}.
- **FKs:** booking_id.
- **Unique:** `(booking_id, installment_no)`.
- **Indexes:** `(booking_id)`, `(state)`, `(due_at) WHERE state IN (pending,due,overdue)`.
- **Created by:** booking confirmation logic. **Updated by:** payment engine (state, paid_amount).
- **Never delete:** cancel via state.
- **Rule encoding:**
  - Booking ≥7 days out → 2 rows: `advance` 50% due now, `balance` 50% due (check_in − 7d).
  - Booking <7 days out → 1 row: `full` 100% due now.
  - Supports **multiple attempts** because attempts live in `Payment`, keyed back to the installment.

---

## 6. Payment

- **Purpose:** An individual charge attempt against an installment. Append-only. Many per booking.
- **Table:** `payments`
- **PK:** `id uuid`
- **Mutable:** only `state` and gateway-echo fields until terminal; amount/currency immutable. **Never delete / never overwrite value.**

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id |
| schedule_id | uuid | ✔ | — | FK → payment_schedules.id |
| type | enum `payment_type` | ✔ | — | advance \| balance \| full |
| attempt_no | smallint | ✔ | 1 | retry counter within installment |
| amount | bigint | ✔ | — | paise (guest-charged) |
| currency | char(3) | ✔ | 'INR' | |
| gateway | text | ✔ | 'razorpay' | provider slug |
| gateway_order_id | text | ○ | — | provider order/intent id |
| gateway_payment_id | text | ○ | — | provider payment id (set on capture) |
| gateway_fee | bigint | ✔ | 0 | paise, **Earthy absorbs** |
| gateway_signature | text | ○ | — | verification |
| state | enum `payment_state` | ✔ | 'created' | payment state |
| failure_code | text | ○ | — | |
| idempotency_key | text | ✔ | — | client-generated per attempt, unique |
| captured_at / failed_at | timestamptz | ○ | — | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `payment_type` = {advance, balance, full}. `payment_state` = {created, pending, authorized, captured, succeeded, failed, cancelled, refunded, partially_refunded}.
- **FKs:** booking_id, schedule_id.
- **Unique (idempotency):**
  - `idempotency_key` unique
  - `gateway_payment_id` unique (nullable) — **prevents duplicate webhook capture**
  - `gateway_order_id` unique per `(gateway)` where used to start one charge
  - `(schedule_id, attempt_no)` unique
- **Indexes:** `(booking_id)`, `(schedule_id)`, `(state)`, `(gateway_payment_id)`, `(gateway_order_id)`.
- **Created by:** checkout / balance-collection job / retry. **Updated by:** gateway webhook (state, gateway_payment_id, captured_at) via idempotent handler.
- **On success:** triggers `postJournal()` (guest cash in, gateway fee expense); updates schedule.paid_amount and booking.payment_status.
- **Never:** modify amount; delete rows; reuse gateway_payment_id.

---

## 7. BookingFinancial

- **Purpose:** Current, **mutable derived snapshot** of a booking's money picture for fast reads/UI. **Not** the accounting history — the ledger is. Recomputed from ledger on each material event.
- **Table:** `booking_financials`
- **PK:** `id uuid`
- **Mutable:** Yes (recomputed). One row per booking.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id, **unique** |
| currency | char(3) | ✔ | 'INR' | |
| base_value | bigint | ✔ | — | list value |
| discount | bigint | ✔ | 0 | |
| taxable_amount | bigint | ✔ | — | base − discount |
| gst_amount | bigint | ✔ | 0 | computed via TaxRule |
| tax_rule_id | uuid | ○ | — | FK → tax_rules.id (applied version) |
| guest_total | bigint | ✔ | — | taxable + gst |
| amount_paid | bigint | ✔ | 0 | successful payments |
| amount_due | bigint | ✔ | — | guest_total − paid |
| refunded_amount | bigint | ✔ | 0 | |
| final_retained_revenue | bigint | ✔ | 0 | guest_total − refunds (net kept) |
| commission_bps | integer | ✔ | — | from booking snapshot |
| earthy_commission | bigint | ✔ | 0 | **commission on final retained revenue** |
| gateway_fee_total | bigint | ✔ | 0 | Earthy-absorbed |
| host_payable | bigint | ✔ | 0 | retained − commission (fees excluded) |
| computed_at | timestamptz | ✔ | now() | last recompute |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **FKs:** booking_id (unique), tax_rule_id.
- **Unique:** booking_id. **Indexes:** `(booking_id)`.
- **Created by:** booking confirmation. **Updated by:** recompute service after any Payment/Refund/Adjustment posts to ledger.
- **Invariant (must hold after recompute):**
  - `host_payable = final_retained_revenue − earthy_commission` (gateway fee **not** deducted from host)
  - `earthy_commission = round(final_retained_revenue_net_of_tax × commission_bps / 10000)` — commission computed on **retained** revenue, not original booking value.
- **Never:** treated as source of truth. Any disagreement with the ledger → ledger wins, snapshot is rebuilt.

---

## 8. PaymentAccount

- **Purpose:** A host's (or Earthy internal entity's) financial/payout profile with the gateway. Gate for receiving confirmed marketplace bookings.
- **Table:** `payment_accounts`
- **PK:** `id uuid`
- **Mutable:** status/eligibility fields. **Never delete** (history).

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| user_id | uuid | ✔ | — | FK → users.id, **unique** |
| provider | text | ✔ | 'razorpay' | route/linked-account provider |
| provider_account_id | text | ○ | — | e.g. RazorpayX linked acct id |
| legal_name | text | ✔ | — | |
| entity_type | enum `entity_type` | ✔ | — | individual/proprietor/... |
| pan | text | ○ | — | reference; encrypted at rest |
| gstin | text | ○ | — | nullable |
| is_internal | boolean | ✔ | false | Earthy-owned entity |
| onboarding_status | enum `onboarding_status` | ✔ | 'not_started' | |
| kyc_status | enum `kyc_status` | ✔ | 'pending' | mirrors latest KYC |
| payout_eligible | boolean | ✔ | false | derived gate |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `entity_type` = {individual, sole_proprietor, partnership, llp, private_limited, internal}. `onboarding_status` = {not_started, in_progress, submitted, active, suspended}. `kyc_status` = {pending, submitted, under_review, verified, rejected, action_required}.
- **FKs:** user_id (unique). **Unique:** user_id; provider_account_id (nullable).
- **Indexes:** `(user_id)`, `(payout_eligible)`, `(kyc_status)`.
- **Created by:** host onboarding start / internal seed. **Updated by:** onboarding + KYC engine + admin.
- **Gate rule (#13):** a booking may only reach `confirmed` for an external host if that host's PaymentAccount has `kyc_status=verified` AND a verified primary BankAccount. Internal accounts bypass external verification but still exist for ledger balance.

---

## 9. KYC

- **Purpose:** KYC review record for a PaymentAccount. Stores **references**, not raw sensitive documents.
- **Table:** `kyc_records`
- **PK:** `id uuid`
- **Mutable:** status/review fields; append new record for re-submission.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| payment_account_id | uuid | ✔ | — | FK → payment_accounts.id |
| status | enum `kyc_status` | ✔ | 'pending' | |
| document_refs | jsonb | ○ | — | secure storage keys/tokens only, no raw docs |
| provider_ref | text | ○ | — | gateway KYC reference |
| submitted_at | timestamptz | ○ | — | |
| reviewed_at | timestamptz | ○ | — | |
| reviewed_by | uuid | ○ | — | FK → users.id (admin) |
| rejection_reason | text | ○ | — | |
| action_required_note | text | ○ | — | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enum:** `kyc_status` (shared, above).
- **FKs:** payment_account_id, reviewed_by. **Indexes:** `(payment_account_id)`, `(status)`.
- **Created by:** host submission. **Updated by:** admin/provider review. **Never delete.**
- **Security:** no PAN images, ID scans, or selfies stored in Postgres — only opaque references to secure object storage / provider vault.

---

## 10. BankAccount

- **Purpose:** Host bank destination for payouts. Changes create **auditable history** (append-only + primary flag).
- **Table:** `bank_accounts`
- **PK:** `id uuid`
- **Mutable:** verification_status, is_primary, effective dates. Account digits immutable per row — a change = new row.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| payment_account_id | uuid | ✔ | — | FK → payment_accounts.id |
| account_holder_name | text | ✔ | — | |
| account_ref | text | ✔ | — | encrypted / tokenized account number |
| account_last4 | text | ✔ | — | display only |
| ifsc | text | ✔ | — | |
| verification_status | enum `bank_verification_status` | ✔ | 'unverified' | |
| provider_verification_ref | text | ○ | — | penny-drop/VPA ref |
| is_primary | boolean | ✔ | false | one active primary per account |
| effective_from | timestamptz | ✔ | now() | |
| effective_to | timestamptz | ○ | — | null = current |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enum:** `bank_verification_status` = {unverified, pending, verified, failed}.
- **FKs:** payment_account_id.
- **Unique:** partial unique index `(payment_account_id) WHERE is_primary AND effective_to IS NULL` — exactly one live primary.
- **Indexes:** `(payment_account_id)`, `(verification_status)`.
- **Created by:** host adds account. **Updated by:** verification engine; superseding sets `effective_to` + inserts new row (never edit digits). **Never delete.** Every change writes AuditLog (rule: bank changes auditable).

---

## 11. TaxRule

- **Purpose:** Versioned, effective-dated GST rules. **Not** hard-coded into bookings. Evaluated per **unit per day**.
- **Table:** `tax_rules`
- **PK:** `id uuid`
- **Mutable:** only `is_active` toggling / expiry; rates never edited in place — new version row.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| category | enum `tax_category` | ✔ | — | accommodation \| experience \| ... |
| jurisdiction | text | ✔ | 'IN' | |
| threshold_amount | bigint | ○ | — | paise, per unit per day (e.g. 750000 = ₹7,500) |
| comparator | enum `tax_comparator` | ✔ | 'lte' | applies at ≤ / > threshold |
| rate_bps | integer | ✔ | — | 500=5%, 1800=18% |
| version | integer | ✔ | 1 | |
| effective_from | date | ✔ | — | |
| effective_to | date | ○ | — | null = open |
| is_active | boolean | ✔ | true | |
| notes | text | ○ | — | "to be finalized with CA" |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `tax_category` = {accommodation, experience, service, other}. `tax_comparator` = {lte, gt}.
- **Indexes:** `(category, jurisdiction, effective_from)`, `(is_active)`.
- **Unique:** `(category, jurisdiction, comparator, threshold_amount, version)`.
- **Encoding of rule #14:** two active accommodation rows — `{comparator: lte, threshold: ₹7,500 → 5%}` and `{comparator: gt, threshold: ₹7,500 → 18%}`. Evaluation input = per-unit nightly value. Applied `tax_rule_id` stored on BookingFinancial.
- **Created by:** admin/finance. **Updated by:** finance versioning (new rows). **Never delete** any version referenced by a booking.

---

## 12. CommissionRule

- **Purpose:** Versioned, effective-dated commission config with scope. V1 default 15%. Applicable rate **snapshotted onto booking** at confirm.
- **Table:** `commission_rules`
- **PK:** `id uuid`
- **Mutable:** is_active/expiry; rate never edited — new version.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| scope | enum `commission_scope` | ✔ | 'global' | resolution precedence |
| host_id | uuid | ○ | — | FK → users.id (scope=host) |
| property_id | uuid | ○ | — | FK (scope=property) |
| experience_id | uuid | ○ | — | FK (scope=experience) |
| category | enum `booking_kind` | ○ | — | property/experience default |
| rate_bps | integer | ✔ | 1500 | 15% |
| version | integer | ✔ | 1 | |
| effective_from | date | ✔ | — | |
| effective_to | date | ○ | — | |
| is_active | boolean | ✔ | true | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enum:** `commission_scope` = {global, category, host, property, experience, promotional, booking_override}.
- **Resolution precedence (most specific wins):** booking_override > promotional > property/experience > host > category > global.
- **FKs:** host_id, property_id, experience_id. **Indexes:** `(scope)`, `(host_id)`, `(property_id)`, `(experience_id)`, `(is_active, effective_from)`.
- **Created by:** admin/finance. **Updated by:** versioning. **Never delete** referenced versions.
- **Snapshot rule (#6, #12):** at confirmation the resolved rule id + `rate_bps` are copied into `bookings.commission_rule_id_snapshot` / `commission_bps_snapshot`. Later rule edits never change historical bookings.

---

## 13. LedgerEntry

- **Purpose:** **Immutable, double-entry, append-only accounting history — the single financial source of truth.** Every money movement is one balanced journal (Σdebits = Σcredits).
- **Table:** `ledger_entries`
- **PK:** `id uuid`
- **Mutable:** **NO — fully immutable.** No UPDATE, no DELETE, ever.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK (single leg) |
| journal_id | uuid | ✔ | — | groups legs of one balanced journal |
| line_no | smallint | ✔ | — | leg index within journal |
| account | enum `ledger_account` | ✔ | — | chart-of-accounts reference |
| direction | enum `dc` | ✔ | — | debit \| credit |
| amount | bigint | ✔ | — | paise, always positive |
| currency | char(3) | ✔ | 'INR' | |
| event_type | enum `ledger_event` | ✔ | — | what happened |
| booking_id | uuid | ○ | — | FK → bookings.id |
| payment_id | uuid | ○ | — | FK → payments.id |
| refund_id | uuid | ○ | — | FK → refunds.id |
| payout_id | uuid | ○ | — | FK → payouts.id |
| adjustment_id | uuid | ○ | — | FK → adjustments.id |
| dispute_id | uuid | ○ | — | FK → disputes.id |
| reference | text | ○ | — | external/human ref |
| created_by | uuid | ○ | — | FK → users.id (null = system) |
| is_system | boolean | ✔ | true | |
| metadata | jsonb | ○ | — | |
| created_at | timestamptz | ✔ | now() | no updated_at (immutable) |

- **Enums:**
  - `dc` = {debit, credit}
  - `ledger_account` (chart of accounts) = {guest_cash, gateway_clearing, gateway_fee_expense, earthy_commission_revenue, host_payable_liability, host_payout_clearing, refund_payable, gst_payable, adjustment_expense, adjustment_income, dispute_hold, internal_inventory_equity}
  - `ledger_event` = {advance_captured, balance_captured, full_captured, gateway_fee, commission_recognized, gst_recognized, refund_issued, payout_scheduled, payout_paid, payout_reversed, adjustment_credit, adjustment_debit, dispute_hold, dispute_release}
- **FKs:** all the *_id references above.
- **Unique:** `(journal_id, line_no)`.
- **Indexes:** `(journal_id)`, `(booking_id)`, `(payment_id)`, `(payout_id)`, `(account)`, `(event_type)`, `(created_at)`.
- **Created by:** **only** the `postJournal()` service (see below). **Updated/Deleted:** never.
- **Invariant (enforced in `postJournal()` + verifiable by query):** for each `journal_id`, `Σ amount WHERE debit = Σ amount WHERE credit`. Reject the journal otherwise.

### `postJournal()` service boundary (conceptual)
```
postJournal({ event_type, legs: [{account, direction, amount}], refs, actor }) -> journal_id
```
- Validates Σdebits = Σcredits before inserting; inserts all legs in **one DB transaction**.
- **The only writer to `ledger_entries`.** No payment/refund/payout/adjustment service touches balances directly — they *emit journals*.
- Always writes a paired `AuditLog` row.
- Balances are **derived** (`SUM` over legs by account/booking), never stored as an editable number.

**Representative journals**
- Advance captured: DR guest_cash / CR gateway_clearing (+ gateway_fee: DR gateway_fee_expense / CR gateway_clearing).
- Commission recognized (at retention): DR host_payable_liability / CR earthy_commission_revenue.
- Payout paid: DR host_payable_liability / CR host_payout_clearing.
- Refund: DR refund_payable / CR gateway_clearing; commission reversal DR earthy_commission_revenue / CR host_payable_liability as applicable.
- Claw-back after payout: DR adjustment (host debit) / CR refund_payable.

---

## 14. Refund

- **Purpose:** A refund back to the guest. Append-only. Capped at amount actually paid.
- **Table:** `refunds`
- **PK:** `id uuid`
- **Mutable:** state + gateway echo only. Amount immutable. **Never delete.**

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id |
| payment_id | uuid | ✔ | — | FK → payments.id (original) |
| type | enum `refund_type` | ✔ | — | full \| partial |
| trigger | enum `refund_trigger` | ✔ | — | cancellation \| manual \| dispute |
| reason | text | ○ | — | |
| amount | bigint | ✔ | — | paise, ≤ paid on that payment |
| currency | char(3) | ✔ | 'INR' | |
| gateway_refund_id | text | ○ | — | provider ref |
| idempotency_key | text | ✔ | — | unique |
| state | enum `refund_state` | ✔ | 'pending' | |
| processed_at | timestamptz | ○ | — | |
| created_by | uuid | ○ | — | FK → users.id |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `refund_type` = {full, partial}. `refund_trigger` = {cancellation, manual, dispute, host_cancel}. `refund_state` = {pending, processing, succeeded, failed, cancelled}.
- **FKs:** booking_id, payment_id, created_by.
- **Unique:** idempotency_key; gateway_refund_id (nullable).
- **Indexes:** `(booking_id)`, `(payment_id)`, `(state)`, `(gateway_refund_id)`.
- **Cap rule (#11):** `SUM(refunds.amount for payment) ≤ payment.amount` — enforced in service + check via aggregate.
- **On success:** `postJournal()` refund legs; recompute BookingFinancial. If a payout already went out, refund does not reduce the ledger's host_payable retroactively — recovery is via **Adjustment claw-back** (see edge case 12).
- **Created by:** cancellation engine / admin. **Never delete.**

---

## 15. Payout

- **Purpose:** Disbursement to a host for a booking. Append-only lifecycle with strict eligibility gate.
- **Table:** `payouts`
- **PK:** `id uuid`
- **Mutable:** state + provider echo + timestamps. Amount immutable at scheduling. **Never delete.**

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id |
| host_id | uuid | ✔ | — | FK → users.id |
| payment_account_id | uuid | ✔ | — | FK → payment_accounts.id |
| bank_account_id | uuid | ✔ | — | FK → bank_accounts.id (primary at time) |
| amount | bigint | ✔ | — | paise = host_payable |
| currency | char(3) | ✔ | 'INR' | |
| eligible_date | timestamptz | ○ | — | checkout / completion |
| scheduled_date | timestamptz | ○ | — | |
| processing_at | timestamptz | ○ | — | |
| completed_at | timestamptz | ○ | — | |
| provider_payout_id | text | ○ | — | |
| idempotency_key | text | ✔ | — | unique |
| status | enum `payout_status` | ✔ | 'NOT_ELIGIBLE' | payout state |
| hold_reason | text | ○ | — | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enum:** `payout_status` = {NOT_ELIGIBLE, ON_HOLD, ELIGIBLE, PROCESSING, PAID, FAILED, REVERSED, ADJUSTED}.
- **FKs:** booking_id, host_id, payment_account_id, bank_account_id.
- **Unique:** `(booking_id)` (one primary payout per booking; recoveries are Adjustments, not new payouts); idempotency_key; provider_payout_id (nullable).
- **Indexes:** `(host_id)`, `(status)`, `(eligible_date)`, `(scheduled_date)`.
- **Eligibility gate (→ ELIGIBLE) requires ALL:**
  - stay `checked_out_at` set (or experience `completed_at`)
  - PaymentAccount `kyc_status = verified`
  - primary BankAccount `verification_status = verified`
  - booking fully collected (`amount_due = 0`)
  - no unresolved Dispute on booking
  - no pending Refund
  - no payout hold flag
- **On PAID:** `postJournal()` DR host_payable_liability / CR host_payout_clearing.
- **Created by:** payout scheduler (created NOT_ELIGIBLE, promoted as gates pass). **Never delete.**

---

## 16. Adjustment

- **Purpose:** Corrections and one-off credits/debits that must **never mutate** an original transaction — claw-backs, goodwill, penalties, compensation, corrections.
- **Table:** `adjustments`
- **PK:** `id uuid`
- **Mutable:** state only. **Never delete.**

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ○ | — | FK → bookings.id (nullable for account-level) |
| target_user_id | uuid | ✔ | — | FK → users.id (host or guest) |
| type | enum `adjustment_type` | ✔ | — | |
| direction | enum `dc` | ✔ | — | debit/credit relative to target |
| amount | bigint | ✔ | — | paise |
| currency | char(3) | ✔ | 'INR' | |
| reason | text | ✔ | — | |
| related_refund_id | uuid | ○ | — | FK → refunds.id (claw-back linkage) |
| related_payout_id | uuid | ○ | — | FK → payouts.id |
| state | enum `adjustment_state` | ✔ | 'pending' | |
| created_by | uuid | ✔ | — | FK → users.id (admin) |
| applied_at | timestamptz | ○ | — | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `adjustment_type` = {host_credit, host_debit, guest_compensation, goodwill, penalty, clawback, correction}. `adjustment_state` = {pending, applied, settled, cancelled}.
- **FKs:** booking_id, target_user_id, related_refund_id, related_payout_id, created_by.
- **Indexes:** `(booking_id)`, `(target_user_id)`, `(type)`, `(state)`.
- **On applied:** `postJournal()` adjustment legs. **Created by:** admin/finance (never by mutating originals). **Never delete.**
- **Claw-back use:** refund after payout → create `clawback` host_debit adjustment linked to the refund; recover via next payout offset or direct recovery.

---

## 17. Dispute

- **Purpose:** Guest/host dispute or chargeback, with funds held pending resolution.
- **Table:** `disputes`
- **PK:** `id uuid`
- **Mutable:** status/resolution. **Never delete.**

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| booking_id | uuid | ✔ | — | FK → bookings.id |
| raised_by | enum `actor_kind` | ✔ | — | guest \| host \| admin |
| guest_id | uuid | ✔ | — | FK → users.id |
| host_id | uuid | ✔ | — | FK → users.id |
| amount_on_hold | bigint | ✔ | 0 | paise |
| currency | char(3) | ✔ | 'INR' | |
| reason | text | ✔ | — | |
| status | enum `dispute_status` | ✔ | 'open' | |
| resolution | enum `dispute_resolution` | ○ | — | |
| resolution_note | text | ○ | — | |
| gateway_dispute_id | text | ○ | — | chargeback ref |
| opened_at | timestamptz | ✔ | now() | |
| resolved_at | timestamptz | ○ | — | |
| created_at / updated_at | timestamptz | ✔ | now() | |

- **Enums:** `dispute_status` = {open, under_review, awaiting_evidence, resolved, closed}. `dispute_resolution` = {guest_favor, host_favor, split, withdrawn}.
- **FKs:** booking_id, guest_id, host_id. **Unique:** gateway_dispute_id (nullable).
- **Indexes:** `(booking_id)`, `(status)`, `(host_id)`.
- **Effect:** open dispute sets booking.payment_status hint `in_dispute`, blocks payout eligibility, may post a `dispute_hold` journal. Resolution posts release/adjustment journals. **Created by:** guest/host/admin/gateway webhook. **Never delete.**

---

## 18. AuditLog

- **Purpose:** Immutable trail of every financial/admin mutation. Append-only.
- **Table:** `audit_logs`
- **PK:** `id uuid`
- **Mutable:** **NO.** Never update or delete.

| Field | Type | Req | Default | Notes |
|---|---|---|---|---|
| id | uuid | ✔ | gen_random_uuid() | PK |
| actor_id | uuid | ○ | — | FK → users.id (null = system) |
| actor_kind | enum `actor_kind` | ✔ | 'system' | |
| action | text | ✔ | — | e.g. 'payout.paid' |
| entity | text | ✔ | — | table name |
| entity_id | uuid | ✔ | — | affected row |
| before | jsonb | ○ | — | prior state |
| after | jsonb | ○ | — | new state |
| reason | text | ○ | — | |
| request_id | text | ○ | — | correlation / reference id |
| created_at | timestamptz | ✔ | now() | no updated_at |

- **FKs:** actor_id.
- **Indexes:** `(entity, entity_id)`, `(actor_id)`, `(action)`, `(created_at)`, `(request_id)`.
- **Created by:** every financial/admin service (esp. `postJournal()`, bank changes, KYC decisions, rule versioning, payout/refund/adjustment). **Never delete.**
- **Future:** `actor_id` becomes individual admin identities (replacing shared admin password) — schema already supports per-admin attribution.

---

# A. Final Entity List

| # | Entity | Table | Class |
|---|---|---|---|
| 1 | User | `users` | core |
| 2 | Property | `properties` | core |
| 3 | Experience | `experiences` | core |
| 4 | Booking | `bookings` | core |
| 5 | PaymentSchedule | `payment_schedules` | payment |
| 6 | Payment | `payments` | payment (append-only) |
| 7 | BookingFinancial | `booking_financials` | derived snapshot (mutable) |
| 8 | PaymentAccount | `payment_accounts` | host onboarding |
| 9 | KYC | `kyc_records` | host onboarding |
| 10 | BankAccount | `bank_accounts` | host onboarding (append history) |
| 11 | TaxRule | `tax_rules` | rules (versioned) |
| 12 | CommissionRule | `commission_rules` | rules (versioned) |
| 13 | LedgerEntry | `ledger_entries` | financial (immutable) |
| 14 | Refund | `refunds` | financial (append-only) |
| 15 | Payout | `payouts` | financial (append-only) |
| 16 | Adjustment | `adjustments` | financial (append-only) |
| 17 | Dispute | `disputes` | financial |
| 18 | AuditLog | `audit_logs` | security (immutable) |

Plus retained existing: **StoredInquiry** (`stored_inquiries`) — lead/inquiry record, referenced by Booking, unchanged.

---

# B. ER Diagram (text)

```
User (1)───<(N) Property
User (1)───<(N) Experience
User (1)───<(N) Booking            [as guest_id]
User (1)───<(N) Booking            [as host_id]
User (1)───1 PaymentAccount
User (1)───<(N) Adjustment         [target_user_id]

StoredInquiry (1)───0/1 Booking    [inquiry_id, lead→booking]

Property   (1)───<(N) Booking
Experience (1)───<(N) Booking

PaymentAccount (1)───<(N) KYC
PaymentAccount (1)───<(N) BankAccount
PaymentAccount (1)───<(N) Payout

Booking (1)───<(N) PaymentSchedule
Booking (1)───<(N) Payment
Booking (1)───1 BookingFinancial
Booking (1)───<(N) Refund
Booking (1)───0/1 Payout
Booking (1)───<(N) Adjustment
Booking (1)───<(N) Dispute
Booking (1)───<(N) LedgerEntry

PaymentSchedule (1)───<(N) Payment
Payment (1)───<(N) Refund

CommissionRule (1)───<(N) Booking          [commission_rule_id_snapshot]
CommissionRule (1)───<(N) BookingFinancial [commission context]
TaxRule        (1)───<(N) BookingFinancial [tax_rule_id]

LedgerEntry ──references──> Booking, Payment, Refund, Payout, Adjustment, Dispute
AuditLog    ──references──> every entity (entity + entity_id), User (actor_id)

postJournal() ──sole writer──> LedgerEntry (+ AuditLog)
```

---

# C. Recommended Indexes

- **users:** `(email)`, `(is_host) WHERE is_host`, `(role)`
- **properties:** `(host_id)`, `(status)`, `(type)`
- **experiences:** `(host_id)`, `(status)`
- **bookings:** `(guest_id)`, `(host_id)`, `(property_id)`, `(experience_id)`, `(operational_status)`, `(payment_status)`, `(check_in)`, `(confirmed_at)`
- **payment_schedules:** `(booking_id)`, `(state)`, `(due_at) WHERE state IN (pending,due,overdue)`
- **payments:** `(booking_id)`, `(schedule_id)`, `(state)`, `(gateway_payment_id)`, `(gateway_order_id)`
- **booking_financials:** `(booking_id)`
- **payment_accounts:** `(user_id)`, `(payout_eligible)`, `(kyc_status)`
- **kyc_records:** `(payment_account_id)`, `(status)`
- **bank_accounts:** `(payment_account_id)`, `(verification_status)`
- **tax_rules:** `(category, jurisdiction, effective_from)`, `(is_active)`
- **commission_rules:** `(scope)`, `(host_id)`, `(property_id)`, `(experience_id)`, `(is_active, effective_from)`
- **ledger_entries:** `(journal_id)`, `(booking_id)`, `(payment_id)`, `(payout_id)`, `(account)`, `(event_type)`, `(created_at)`
- **refunds:** `(booking_id)`, `(payment_id)`, `(state)`, `(gateway_refund_id)`
- **payouts:** `(host_id)`, `(status)`, `(eligible_date)`, `(scheduled_date)`
- **adjustments:** `(booking_id)`, `(target_user_id)`, `(type)`, `(state)`
- **disputes:** `(booking_id)`, `(status)`, `(host_id)`
- **audit_logs:** `(entity, entity_id)`, `(actor_id)`, `(action)`, `(created_at)`, `(request_id)`

---

# D. Recommended Unique Constraints

- **users:** `email`; `phone` (nullable)
- **properties/experiences:** `slug`
- **bookings:** `booking_number`
- **payment_schedules:** `(booking_id, installment_no)`
- **payments:** `idempotency_key`; `gateway_payment_id` (nullable) — **webhook idempotency**; `gateway_order_id` per gateway; `(schedule_id, attempt_no)`
- **booking_financials:** `booking_id`
- **payment_accounts:** `user_id`; `provider_account_id` (nullable)
- **bank_accounts:** partial unique `(payment_account_id) WHERE is_primary AND effective_to IS NULL`
- **tax_rules:** `(category, jurisdiction, comparator, threshold_amount, version)`
- **commission_rules:** `(scope, host_id, property_id, experience_id, category, version)` (nulls-not-distinct where supported)
- **ledger_entries:** `(journal_id, line_no)`
- **refunds:** `idempotency_key`; `gateway_refund_id` (nullable)
- **payouts:** `(booking_id)`; `idempotency_key`; `provider_payout_id` (nullable)
- **disputes:** `gateway_dispute_id` (nullable)

---

# E. Immutable vs Mutable Fields

**Fully immutable tables (append-only, no UPDATE/DELETE of value):** `ledger_entries`, `audit_logs`.

**Append-only + limited state transitions (value never rewritten):** `payments` (state, gateway echo only), `refunds`, `payouts`, `adjustments`.

**Booking write-once-at-confirmation fields:** `cancellation_policy_snapshot`, `cancellation_terms_snapshot`, `commission_rule_id_snapshot`, `commission_bps_snapshot`, `kind`, `guest_id`, `host_id`, `property_id`/`experience_id`, `original_price`.

**Rules — versioned (new row, old rows never edited):** `tax_rules`, `commission_rules`.

**Bank accounts:** account digits/IFSC immutable per row; changes = supersede (`effective_to`) + insert.

**Mutable/derived:** `booking_financials` (recomputed from ledger), profile fields on `users`, listing content on `properties`/`experiences`, operational statuses.

---

# F. State / Status Definitions (state is deliberately split — no single generic status)

**Operational (Booking) — `booking_op_status`:** draft → pending_confirmation → confirmed → in_progress → completed; plus cancelled, expired.

**Payment (Booking) — `booking_payment_status`:** unpaid → advance_paid → fully_paid; refunded_partial, refunded_full, in_dispute.

**Installment — `installment_state`:** pending, due, paid, overdue, waived, cancelled.

**Payment attempt — `payment_state`:** created, pending, authorized, captured, succeeded, failed, cancelled, refunded, partially_refunded.

**Payout — `payout_status`:** NOT_ELIGIBLE, ON_HOLD, ELIGIBLE, PROCESSING, PAID, FAILED, REVERSED, ADJUSTED.

**Refund — `refund_state`:** pending, processing, succeeded, failed, cancelled.

**Adjustment — `adjustment_state`:** pending, applied, settled, cancelled.

**Dispute — `dispute_status`:** open, under_review, awaiting_evidence, resolved, closed. Resolution: guest_favor, host_favor, split, withdrawn.

**KYC — `kyc_status`:** pending, submitted, under_review, verified, rejected, action_required.

**Onboarding — `onboarding_status`:** not_started, in_progress, submitted, active, suspended.

**Bank — `bank_verification_status`:** unverified, pending, verified, failed.

**Financial (ledger) state** is not a column — it is the derived balance from `ledger_entries`.

---

# G. Financial Invariants

1. **Ledger balances per journal:** `Σ debit amount = Σ credit amount` for every `journal_id`. Enforced in `postJournal()`.
2. **Ledger is sole truth:** all balances derive from `ledger_entries`; `booking_financials` is rebuildable and must match.
3. **Commission on retained revenue:** `earthy_commission = round(final_retained_revenue_net_of_tax × commission_bps_snapshot / 10000)` — not on original booking value.
4. **Gateway fee never reduces host payout:** `host_payable = final_retained_revenue − earthy_commission`; `gateway_fee_total` hits `gateway_fee_expense` only (Earthy absorbs).
5. **Refund cap:** `Σ refunds.amount per payment ≤ payment.amount`; per booking `Σ refunds ≤ amount_paid`.
6. **Cancellation collection cap:** guest-collected cancellation charge ≤ amount already paid (rule #11), even if policy-computed charge is higher.
7. **Payout ≤ retained:** `payout.amount ≤ host_payable`; recoveries after payout only via Adjustment claw-back, never by editing the payout.
8. **One primary bank per account** at a time.
9. **Idempotency:** a gateway_payment_id / gateway_refund_id / provider_payout_id maps to at most one row.
10. **No destructive edits:** financial rows are never deleted or value-overwritten; corrections are reversals/adjustments.
11. **Snapshot immutability:** confirmed booking's commission bps, tax classification applied, and cancellation terms never change retroactively.
12. **Payout gate:** ELIGIBLE requires checkout/completion + KYC verified + bank verified + fully collected + no open dispute + no pending refund + no hold.

---

# H. Edge-Case Handling

1. **Booking 10 days before check-in** → 2 PaymentSchedule rows: advance 50% due now, balance 50% due (check_in−7d). op_status confirmed, payment_status advance_paid after first capture.
2. **Booking 3 days before check-in** → 1 PaymentSchedule row `full` 100% due now; no second installment.
3. **Advance payment succeeds** → Payment.state=succeeded; postJournal(advance_captured + gateway_fee); schedule.paid_amount updated; booking.payment_status=advance_paid; BookingFinancial recomputed.
4. **Advance payment fails** → Payment.state=failed with failure_code; schedule stays pending/due; new Payment row (attempt_no+1) on retry; booking stays pending_confirmation; no ledger entry.
5. **Balance payment succeeds** → Payment(type=balance) succeeded; postJournal(balance_captured); schedule paid; payment_status=fully_paid; commission recognized; payout gate opens on checkout.
6. **Balance payment fails** → failed Payment; installment overdue; retry via new attempt; if never paid, cancellation/hold flow; booking not eligible for check-in per ops policy.
7. **Guest cancels before balance payment** → cancellation engine computes charge from total value, capped at amount paid (advance). Refund for any excess; postJournal(refund + commission reversal); booking cancelled; balance schedule cancelled.
8. **Guest cancels after full payment** → policy computes retained charge from total value (cap = paid = full); Refund for remainder; commission recomputed on final_retained_revenue; ledger reversal journals.
9. **Host cancels** → full guest refund (refund_trigger=host_cancel); commission reversed to 0; possible host penalty via Adjustment (penalty); booking cancelled, cancelled_by=host.
10. **Full refund** → Refund type=full ≤ paid; postJournal reverses guest cash + commission; final_retained_revenue→0; host_payable→0.
11. **Partial refund** → Refund type=partial; retained revenue reduced; commission recomputed on new retained amount; host_payable reduced accordingly.
12. **Refund after payout** → Refund proceeds to guest; since host already paid, create Adjustment(type=clawback, host_debit) linked to refund; recover from next payout or direct recovery; payout row untouched, status may become ADJUSTED.
13. **Guest dispute** → Dispute row open, amount_on_hold set; postJournal(dispute_hold); payout gate blocked; resolution posts release or refund/adjustment journals.
14. **Host payout hold** → Payout.status=ON_HOLD with hold_reason; blocked until cleared; no funds move.
15. **Failed host payout** → Payout.status=FAILED; no ledger movement finalized (or reversed if provisionally posted); retry creates recovery flow; investigate bank/KYC.
16. **Host changes bank account** → new BankAccount row, old one `effective_to` set, primary flag moves; AuditLog written; in-flight payouts reference the bank_account_id captured at scheduling.
17. **Host changes commission** → new CommissionRule version (effective-dated); existing confirmed bookings keep `commission_bps_snapshot`; only future bookings use new rate.
18. **Host changes cancellation policy** → property/experience default updated; confirmed bookings keep `cancellation_policy_snapshot` + `cancellation_terms_snapshot`; unaffected.
19. **Property changes GST classification** → new TaxRule version; historical BookingFinancial keeps its applied `tax_rule_id`; future bookings evaluate current active rules per unit per day.
20. **Duplicate gateway webhook** → unique `gateway_payment_id` (and idempotency_key) rejects the duplicate; handler is a no-op after first success; no double ledger posting.
21. **Duplicate payment attempt** → unique `idempotency_key` + `(schedule_id, attempt_no)` prevents double charge; retries must use a fresh key/attempt_no.
22. **Earthy-owned property, no external host** → property.is_internal_inventory=true, host_id = internal Earthy User with internal PaymentAccount; commission effectively 100% retained; host_payable settles to internal_inventory_equity so ledger still balances; no external KYC/payout gate.
23. **Experience payout after completion** → eligible_date = booking.completed_at (not checkout); same payout gate (KYC/bank/collected/no dispute); postJournal(payout_paid) on PAID.

---

# I. Questions to Resolve Before Phase 1B.2

1. **Payment gateway choice** — Razorpay Route vs RazorpayX vs PayU vs Cashfree? Determines linked-account onboarding model, KYC provider fields, and payout API. (Schema assumes provider-agnostic + Razorpay default.)
2. **Commission base w.r.t. GST** — is the 15% computed on the pre-tax retained value or the tax-inclusive value? (I've assumed **net of tax**; must confirm with CA.)
3. **Who bears GST liability** — is Earthy the collector/depositor of GST, or the host? Affects whether `gst_payable` is Earthy's liability or pass-through. (CA-dependent, rule #14.)
4. **Cancellation tier definitions** — exact refund percentages/day-thresholds for Flexible / Moderate / Strict (to populate `cancellation_terms_snapshot`).
5. **Balance auto-charge vs manual** — is the 7-day balance auto-charged via saved mandate, or does the guest pay on a link? Affects PaymentSchedule automation + retry policy.
6. **Payout timing SLA** — how many days after checkout/completion does payout become ELIGIBLE→PROCESSING (hold window for disputes)?
7. **Refund funding** — refunds netted against Earthy's gateway balance or reversed on original payment? Affects gateway_refund flow.
8. **Multi-unit / per-unit GST** — confirm the exact "per unit per day" value used for the ₹7,500 threshold (nightly rate per unit vs total/nights).
9. **Internal entity accounting** — should internal-inventory bookings still record a nominal commission/host transfer for reporting, or settle entirely to equity?
10. **Migration of existing JSON data** — which existing StoredInquiry / listing / user data migrates into Postgres in 1B.2, and is there historical booking/payment data to backfill into the ledger (or ledger starts clean)?
11. **Admin identity** — timeline for replacing shared admin password with per-admin accounts (AuditLog.actor_id already supports it).
12. **Currency/rounding policy** — confirm paise integer storage + rounding rule (round-half-up) for commission/GST splits.
13. **Dispute/chargeback source** — are disputes gateway-driven (chargebacks) only, or also internal guest-raised complaints? Affects Dispute creation triggers.
