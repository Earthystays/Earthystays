/**
 * Pure transform + validation for the Phase B JSON → PostgreSQL migration.
 *
 * NO filesystem, NO database access here — every function takes parsed JSON and
 * returns typed rows plus a MigrationReport. This is what the test-suite drives
 * and what the runner (run.ts) calls after reading data/*.json.
 *
 * Guardrails (spec §11):
 *   • NO payments / refunds / payouts / commissions / ledger entries / bookings
 *     are ever produced from legacy JSON.
 *   • A legacy inquiry with status "booked" stays an inquiry; booking_id = null.
 *   • Experience marketing personas are NEVER treated as payout users.
 */
import { rupeesToPaise } from "../schema/_shared";
import type { NewExperienceRow } from "../schema/experiences";
import type { NewPaymentAccountRow } from "../schema/payment-account";
import type { NewPropertyRow } from "../schema/properties";
import type { NewStoredInquiryRow } from "../schema/stored-inquiries";
import type { NewUserRow } from "../schema/users";
import { emptyReport, type MigrationReport } from "./report";

/** Fixed, deterministic id for the internal Earthy entity (owned inventory). */
export const INTERNAL_EARTHY_USER_ID = "usr_earthy_internal";

const VALID_PROPERTY_TYPES = new Set(["villa", "apartment", "hotel", "hostel"]);
const VALID_POLICY_PRESETS = new Set(["flexible", "moderate", "strict"]);

type Json = Record<string, unknown>;

function toDate(v: unknown): Date | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Detect duplicate keys in a source array; records them on the report. */
function collectDuplicates(
  entity: string,
  records: Json[],
  keyOf: (r: Json) => string | undefined,
  report: MigrationReport,
): Set<string> {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const r of records) {
    const k = keyOf(r);
    if (!k) continue;
    if (seen.has(k)) {
      dupes.add(k);
      report.duplicateIds.push({ entity, id: k, reason: "duplicate id in source" });
    }
    seen.add(k);
  }
  return dupes;
}

export type TransformOutput = {
  users: NewUserRow[];
  properties: NewPropertyRow[];
  experiences: NewExperienceRow[];
  inquiries: NewStoredInquiryRow[];
  paymentAccounts: NewPaymentAccountRow[];
  report: MigrationReport;
};

export type TransformInput = {
  users?: Json[];
  villas?: Json[];
  experiences?: Json[];
  inquiries?: Json[];
  mode?: MigrationReport["mode"];
  /** When true, seed the internal Earthy user + payment account. Default true. */
  seedInternalEntity?: boolean;
};

export function transformAll(input: TransformInput): TransformOutput {
  const report = emptyReport(input.mode ?? "dry-run");
  const seedInternal = input.seedInternalEntity ?? true;

  const usersOut: NewUserRow[] = [];
  const propertiesOut: NewPropertyRow[] = [];
  const experiencesOut: NewExperienceRow[] = [];
  const inquiriesOut: NewStoredInquiryRow[] = [];
  const paymentAccountsOut: NewPaymentAccountRow[] = [];

  /* ── Users ─────────────────────────────────────────────────────────── */
  const users = input.users ?? [];
  report.entities.users.found = users.length;
  const userDupes = collectDuplicates("user", users, (r) => r.id as string, report);
  const knownUserIds = new Set<string>();

  for (const u of users) {
    const id = u.id as string | undefined;
    if (!id || !u.email) {
      report.invalidRecords.push({
        entity: "user",
        id: id ?? "(no id)",
        reason: "missing id or email",
      });
      report.entities.users.skipped++;
      continue;
    }
    if (userDupes.has(id) && knownUserIds.has(id)) {
      report.entities.users.skipped++;
      continue; // keep first occurrence only
    }
    report.entities.users.valid++;
    knownUserIds.add(id);
    const isHost = Boolean(u.isHost);
    usersOut.push({
      id,
      email: String(u.email),
      phone: (u.hostPhone as string) ?? null,
      fullName: (u.name as string) ?? String(u.email),
      role: isHost ? "host" : "guest",
      isHost,
      isAdmin: Boolean(u.isAdmin),
      isInternal: false,
      status: "active",
      passwordHash: (u.passwordHash as string) ?? null,
    });

    // A host gets a not-started PaymentAccount (derived, not invented finance).
    if (isHost) {
      paymentAccountsOut.push({
        userId: id,
        legalName: (u.name as string) ?? null,
        isInternal: false,
        onboardingStatus: "not_started",
        kycStatus: "pending",
        payoutEligible: false,
      });
    }
  }

  // Internal Earthy entity for owned inventory (villas have no host).
  if (seedInternal) {
    usersOut.push({
      id: INTERNAL_EARTHY_USER_ID,
      email: "internal@earthystays.com",
      phone: null,
      fullName: "Earthy Stays (Internal)",
      role: "internal",
      isHost: false,
      isAdmin: false,
      isInternal: true,
      status: "active",
      passwordHash: null,
    });
    knownUserIds.add(INTERNAL_EARTHY_USER_ID);
    paymentAccountsOut.push({
      userId: INTERNAL_EARTHY_USER_ID,
      legalName: "Earthy Stays (Internal)",
      entityType: "internal",
      isInternal: true,
      onboardingStatus: "active",
      kycStatus: "verified",
      payoutEligible: false, // internal settlement is not an external payout
    });
    report.warnings.push({
      entity: "user",
      id: INTERNAL_EARTHY_USER_ID,
      reason: "internal Earthy entity + payment account seeded for owned inventory",
    });
  }
  report.entities.paymentAccounts.found = paymentAccountsOut.length;
  report.entities.paymentAccounts.valid = paymentAccountsOut.length;

  /* ── Properties (villas) ───────────────────────────────────────────── */
  const villas = input.villas ?? [];
  report.entities.properties.found = villas.length;
  collectDuplicates("property", villas, (r) => r.slug as string, report);
  const seenSlugs = new Set<string>();

  for (const v of villas) {
    const slug = v.slug as string | undefined;
    if (!slug || !v.name) {
      report.invalidRecords.push({
        entity: "property",
        id: slug ?? "(no slug)",
        reason: "missing slug or name",
      });
      report.entities.properties.skipped++;
      continue;
    }
    if (seenSlugs.has(slug)) {
      report.entities.properties.skipped++;
      continue;
    }
    seenSlugs.add(slug);
    report.entities.properties.valid++;

    const type = VALID_PROPERTY_TYPES.has(String(v.type)) ? (v.type as string) : "villa";
    if (!VALID_PROPERTY_TYPES.has(String(v.type))) {
      report.warnings.push({
        entity: "property",
        id: slug,
        reason: `unknown type "${String(v.type)}" → defaulted to villa`,
      });
    }

    const preset = (v.cancellationPolicy as Json | undefined)?.preset as string | undefined;
    let policy: "flexible" | "moderate" | "strict" | null = null;
    if (preset && VALID_POLICY_PRESETS.has(preset)) {
      policy = preset as "flexible" | "moderate" | "strict";
    } else {
      report.warnings.push({
        entity: "property",
        id: slug,
        reason: preset
          ? `unrecognized cancellation preset "${preset}" → null`
          : "no cancellation policy on legacy record → null",
      });
    }

    const price = typeof v.pricePerNight === "number" ? v.pricePerNight : null;
    if (price == null) {
      report.warnings.push({
        entity: "property",
        id: slug,
        reason: "missing pricePerNight",
      });
    }

    // Legacy villas carry no host → Earthy-owned. Flagged for review.
    report.missingRelationships.push({
      entity: "property",
      id: slug,
      reason: "no host in source → treated as Earthy-owned (host_id left null)",
    });

    propertiesOut.push({
      slug,
      hostId: null,
      name: String(v.name),
      type: type as NewPropertyRow["type"],
      baseNightlyPricePaise: price == null ? null : rupeesToPaise(price),
      currency: "INR",
      cancellationPolicy: policy,
      destinationSlug: (v.destinationSlug as string) ?? null,
      city: (v.city as string) ?? null,
      state: (v.state as string) ?? null,
      status: "active",
      raw: v,
      sourceFile: "villas.json",
    });
  }

  /* ── Experiences ───────────────────────────────────────────────────── */
  const exps = input.experiences ?? [];
  report.entities.experiences.found = exps.length;
  collectDuplicates("experience", exps, (r) => r.slug as string, report);
  const seenExpSlugs = new Set<string>();

  for (const e of exps) {
    const slug = e.slug as string | undefined;
    if (!slug || !e.name) {
      report.invalidRecords.push({
        entity: "experience",
        id: slug ?? "(no slug)",
        reason: "missing slug or name",
      });
      report.entities.experiences.skipped++;
      continue;
    }
    if (seenExpSlugs.has(slug)) {
      report.entities.experiences.skipped++;
      continue;
    }
    seenExpSlugs.add(slug);
    report.entities.experiences.valid++;

    const persona = (e.hostId as string) ?? null;
    // The persona is NOT a real user → host_user_id stays null, flagged.
    report.needsManualReview.push({
      entity: "experience",
      id: slug,
      reason: persona
        ? `hostId "${persona}" is a marketing persona, not a payout user → host_user_id null, needs mapping`
        : "no host on legacy record → needs mapping",
    });

    const price = typeof e.priceFrom === "number" ? e.priceFrom : null;
    const status = String(e.status) === "published" ? "active" : "draft";

    experiencesOut.push({
      slug,
      hostPersonaId: persona,
      hostUserId: null,
      name: String(e.name),
      priceFromPaise: price == null ? null : rupeesToPaise(price),
      currency: (e.currency as string) ?? "INR",
      cancellationPolicyText: (e.cancellationPolicy as string) ?? null,
      citySlug: (e.citySlug as string) ?? null,
      city: (e.city as string) ?? null,
      state: (e.state as string) ?? null,
      status: status as NewExperienceRow["status"],
      raw: e,
      sourceFile: "experiences.json",
    });
  }

  /* ── Stored inquiries (leads — never financial bookings) ───────────── */
  const inquiries = input.inquiries ?? [];
  report.entities.inquiries.found = inquiries.length;
  collectDuplicates("inquiry", inquiries, (r) => r.id as string, report);
  const seenInqIds = new Set<string>();

  for (const q of inquiries) {
    const id = q.id as string | undefined;
    if (!id) {
      report.invalidRecords.push({
        entity: "inquiry",
        id: "(no id)",
        reason: "missing id",
      });
      report.entities.inquiries.skipped++;
      continue;
    }
    if (seenInqIds.has(id)) {
      report.entities.inquiries.skipped++;
      continue;
    }
    seenInqIds.add(id);
    report.entities.inquiries.valid++;

    if (String(q.status) === "booked") {
      report.warnings.push({
        entity: "inquiry",
        id,
        reason: 'legacy status "booked" kept as lead only — NO financial booking created',
      });
    }

    inquiriesOut.push({
      id,
      kind: (q.kind as string) ?? null,
      name: (q.name as string) ?? null,
      phone: (q.phone as string) ?? null,
      guests: q.guests == null ? null : String(q.guests),
      message: (q.message as string) ?? null,
      experienceRef: (q.experience as string) ?? null,
      status: (q.status as string) ?? null,
      bookingId: null, // NEVER linked during migration
      raw: q,
      sourceFile: "inquiries.json",
      legacyCreatedAt: toDate(q.createdAt),
      legacyUpdatedAt: toDate(q.updatedAt),
    });
  }

  // Guardrail assertion: this array must stay empty in Phase B.
  // (financialRecordsCreated is never pushed to by this function.)

  return {
    users: usersOut,
    properties: propertiesOut,
    experiences: experiencesOut,
    inquiries: inquiriesOut,
    paymentAccounts: paymentAccountsOut,
    report,
  };
}
