/**
 * Pure booking-draft builder — the testable core of createBooking(). Phase C.
 *
 * NO database access. Given already-resolved entities (guest, listing) it
 * validates the request, resolves the payout host (real host, internal Earthy
 * entity, or rejects), snapshots policy / commission / tax, computes the
 * expected guest total, and returns the column values for a bookings insert
 * (minus DB-generated id / booking_number / timestamps).
 *
 * Host safety (spec §16/§17):
 *   • Property with no host → Earthy-owned → payout host = internal entity.
 *   • Experience whose persona was never mapped to a real payout user →
 *     rejected with HOST_FINANCIAL_ACCOUNT_NOT_READY (never invent a host).
 */
import { INTERNAL_EARTHY_USER_ID } from "../../db/internal-entity";
import {
  buildCancellationSnapshot,
  type CancellationPolicyType,
} from "../finance/cancellation-policies";
import { buildCommissionSnapshot, resolveCommissionBps } from "../finance/commission";
import {
  computeAccommodationTax,
  computeExperienceTax,
  type TaxSnapshot,
} from "../finance/tax";
import { BookingError } from "./errors";
import { nightsBetween } from "./overlap";

/** Default policy when a legacy listing carries none. */
export const DEFAULT_PROPERTY_POLICY: CancellationPolicyType = "moderate";
export const DEFAULT_EXPERIENCE_POLICY: CancellationPolicyType = "flexible";

export type ResolvedGuest = { id: string };

export type ResolvedProperty = {
  slug: string;
  status: string; // listing_status
  hostId: string | null; // null = Earthy-owned
  baseNightlyPricePaise: number | null;
  cancellationPolicy: CancellationPolicyType | null;
};

export type ResolvedExperience = {
  slug: string;
  status: string;
  hostUserId: string | null; // null = not mapped to a payout user
  hostPersonaId: string | null;
  priceFromPaise: number | null;
};

export type PropertyBookingInput = {
  kind: "property";
  guest: ResolvedGuest;
  property: ResolvedProperty;
  checkIn: string; // YYYY-MM-DD
  checkOut: string; // YYYY-MM-DD
  guestsCount: number;
  unitsCount?: number;
  currency?: string;
};

export type ExperienceBookingInput = {
  kind: "experience";
  guest: ResolvedGuest;
  experience: ResolvedExperience;
  experienceDate: Date;
  guestsCount: number;
  currency?: string;
};

export type BookingInput = PropertyBookingInput | ExperienceBookingInput;

export type BookingDraft = {
  kind: "property" | "experience";
  guestId: string;
  hostId: string;
  propertyId: string | null;
  experienceId: string | null;
  checkIn: string | null;
  checkOut: string | null;
  experienceDate: Date | null;
  guestsCount: number;
  unitsCount: number;
  currency: string;
  originalPricePaise: number;
  expectedGuestTotalPaise: number;
  cancellationPolicyType: CancellationPolicyType;
  cancellationPolicySnapshot: ReturnType<typeof buildCancellationSnapshot>;
  commissionBps: number;
  commissionSnapshot: ReturnType<typeof buildCommissionSnapshot>;
  gstRateBps: number;
  taxSnapshot: TaxSnapshot;
  isInternalInventory: boolean;
  /** Blocking window for the inventory hold. */
  holdStart: Date;
  holdEnd: Date;
};

function assertCommon(guestsCount: number, currency: string) {
  if (currency !== "INR") {
    throw new BookingError("CURRENCY_NOT_SUPPORTED", `V1 is INR only (got ${currency})`);
  }
  if (!Number.isInteger(guestsCount) || guestsCount < 1) {
    throw new BookingError("INVALID_GUEST_COUNT", "guestsCount must be >= 1");
  }
}

export function buildBookingDraft(input: BookingInput, now: Date = new Date()): BookingDraft {
  const currency = input.currency ?? "INR";
  assertCommon(input.guestsCount, currency);

  if (input.kind === "property") {
    const { property } = input;
    if (property.status !== "active") {
      throw new BookingError("INVENTORY_NOT_BOOKABLE", `property ${property.slug} is ${property.status}`);
    }
    if (property.baseNightlyPricePaise == null) {
      throw new BookingError("INVENTORY_NOT_BOOKABLE", `property ${property.slug} has no price`);
    }
    const nights = nightsBetween(input.checkIn, input.checkOut); // throws on bad dates
    if (nights < 1) throw new BookingError("INVALID_DATES", "at least one night required");
    const units = input.unitsCount ?? 1;
    if (!Number.isInteger(units) || units < 1) {
      throw new BookingError("INVALID_GUEST_COUNT", "unitsCount must be >= 1");
    }

    // Host resolution: real host, else internal Earthy entity (owned inventory).
    const isInternal = property.hostId == null;
    const hostId = property.hostId ?? INTERNAL_EARTHY_USER_ID;

    const policyType = property.cancellationPolicy ?? DEFAULT_PROPERTY_POLICY;
    const tax = computeAccommodationTax({
      nightlyPaise: property.baseNightlyPricePaise,
      nights,
      units,
    }, now);
    const base = tax.taxableAmountPaise;
    const commissionBps = resolveCommissionBps("property");

    return {
      kind: "property",
      guestId: input.guest.id,
      hostId,
      propertyId: property.slug,
      experienceId: null,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      experienceDate: null,
      guestsCount: input.guestsCount,
      unitsCount: units,
      currency,
      originalPricePaise: base,
      expectedGuestTotalPaise: base + tax.gstPaise,
      cancellationPolicyType: policyType,
      cancellationPolicySnapshot: buildCancellationSnapshot(policyType, now),
      commissionBps,
      commissionSnapshot: buildCommissionSnapshot("property", now),
      gstRateBps: tax.rateBps,
      taxSnapshot: tax,
      isInternalInventory: isInternal,
      holdStart: new Date(`${input.checkIn}T00:00:00.000Z`),
      holdEnd: new Date(`${input.checkOut}T00:00:00.000Z`),
    };
  }

  // Experience
  const { experience } = input;
  if (experience.status !== "active") {
    throw new BookingError("INVENTORY_NOT_BOOKABLE", `experience ${experience.slug} is ${experience.status}`);
  }
  // Host safety: never invent a payout user for an unmapped marketing persona.
  if (experience.hostUserId == null) {
    throw new BookingError(
      "HOST_FINANCIAL_ACCOUNT_NOT_READY",
      `experience ${experience.slug} has no payout host mapped (persona ${experience.hostPersonaId ?? "none"})`,
    );
  }
  if (experience.priceFromPaise == null) {
    throw new BookingError("INVENTORY_NOT_BOOKABLE", `experience ${experience.slug} has no price`);
  }

  const base = experience.priceFromPaise * input.guestsCount;
  const tax = computeExperienceTax(base, now);
  const policyType = DEFAULT_EXPERIENCE_POLICY;
  const day = new Date(input.experienceDate);
  const dayStart = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

  return {
    kind: "experience",
    guestId: input.guest.id,
    hostId: experience.hostUserId,
    propertyId: null,
    experienceId: experience.slug,
    checkIn: null,
    checkOut: null,
    experienceDate: input.experienceDate,
    guestsCount: input.guestsCount,
    unitsCount: 1,
    currency,
    originalPricePaise: base,
    expectedGuestTotalPaise: base + tax.gstPaise,
    cancellationPolicyType: policyType,
    cancellationPolicySnapshot: buildCancellationSnapshot(policyType, now),
    commissionBps: resolveCommissionBps("experience"),
    commissionSnapshot: buildCommissionSnapshot("experience", now),
    gstRateBps: tax.rateBps,
    taxSnapshot: tax,
    isInternalInventory: false,
    holdStart: dayStart,
    holdEnd: dayEnd,
  };
}
