/**
 * GST tax engine (V1) + snapshot builder. Phase 1B.5 Phase C.
 *
 * Scope here is DELIBERATELY minimal: just enough to compute the expected guest
 * total and to snapshot the applicable rule onto a booking. The full
 * refund/tax ACCOUNTING engine is a later phase.
 *
 * Accommodation (locked):
 *   • ≤ ₹7,500 per unit per day → 5% GST
 *   • > ₹7,500 per unit per day → 18% GST
 * Experience: 5% PROVISIONAL — pending CA confirmation before production.
 *
 * Rates are basis points. The TaxRule DATABASE table (versioned, effective-
 * dated) arrives in Phase E; these constants mirror its V1 content and are
 * snapshotted so later rule changes never alter historical bookings.
 */
import { applyBps } from "../../db/schema/_shared";

export const TAX_RULE_VERSION = 1;

/** ₹7,500 per unit per day, in paise. */
export const ACCOMMODATION_GST_THRESHOLD_PAISE = 750000;
export const ACCOMMODATION_GST_LOW_BPS = 500; // 5%
export const ACCOMMODATION_GST_HIGH_BPS = 1800; // 18%
export const EXPERIENCE_GST_BPS = 500; // 5% provisional

export type TaxSnapshot = {
  category: "accommodation" | "experience";
  version: number;
  rateBps: number;
  /** Reserved for a Phase E TaxRule.id; null under V1 constants. */
  ruleId: string | null;
  thresholdPaise: number | null;
  perUnitPerDayPaise: number | null;
  taxableAmountPaise: number;
  gstPaise: number;
  pendingCaConfirmation: boolean;
  snapshotAt: string;
};

export type AccommodationTaxInput = {
  /** GST-exclusive nightly rate PER UNIT PER DAY, in paise. */
  nightlyPaise: number;
  nights: number;
  units: number;
};

/** The rate is chosen by the PER-UNIT-PER-DAY value, then applied to the base. */
export function accommodationRateBps(nightlyPaise: number): number {
  return nightlyPaise <= ACCOMMODATION_GST_THRESHOLD_PAISE
    ? ACCOMMODATION_GST_LOW_BPS
    : ACCOMMODATION_GST_HIGH_BPS;
}

export function computeAccommodationTax(
  input: AccommodationTaxInput,
  now: Date = new Date(),
): TaxSnapshot {
  const { nightlyPaise, nights, units } = input;
  const taxableAmountPaise = nightlyPaise * nights * units;
  const rateBps = accommodationRateBps(nightlyPaise);
  return {
    category: "accommodation",
    version: TAX_RULE_VERSION,
    rateBps,
    ruleId: null,
    thresholdPaise: ACCOMMODATION_GST_THRESHOLD_PAISE,
    perUnitPerDayPaise: nightlyPaise,
    taxableAmountPaise,
    gstPaise: applyBps(taxableAmountPaise, rateBps),
    pendingCaConfirmation: false,
    snapshotAt: now.toISOString(),
  };
}

export function computeExperienceTax(
  taxableAmountPaise: number,
  now: Date = new Date(),
): TaxSnapshot {
  return {
    category: "experience",
    version: TAX_RULE_VERSION,
    rateBps: EXPERIENCE_GST_BPS,
    ruleId: null,
    thresholdPaise: null,
    perUnitPerDayPaise: null,
    taxableAmountPaise,
    gstPaise: applyBps(taxableAmountPaise, EXPERIENCE_GST_BPS),
    pendingCaConfirmation: true, // experience GST needs CA sign-off
    snapshotAt: now.toISOString(),
  };
}
