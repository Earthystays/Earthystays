/**
 * Commission rules (V1 constants) + snapshot builder. Phase 1B.5 Phase C.
 *
 * V1: 15% for properties, 15% for experiences. Rates are basis points. The
 * CommissionRule DATABASE table (versioned, effective-dated) arrives in Phase E;
 * this module provides the resolved V1 values and the immutable snapshot a
 * booking stores at creation, so future rate changes never alter historical
 * bookings.
 *
 * Commission is calculated on FINAL RETAINED REVENUE, EXCLUDING GST, and gateway
 * fees never reduce host payable — those calculations live in the financial
 * engine (later phase); here we only snapshot the applicable rate.
 */
import type { BookingKind } from "./types";

export const COMMISSION_RULE_VERSION = 1;

export const DEFAULT_COMMISSION_BPS: Record<BookingKind, number> = {
  property: 1500, // 15%
  experience: 1500, // 15%
};

export type CommissionSnapshot = {
  commissionType: BookingKind;
  rateBps: number;
  ruleVersion: number;
  /** Reserved for a Phase E CommissionRule.id; null under V1 constants. */
  ruleId: string | null;
  effectiveFrom: string | null;
  snapshotAt: string;
};

export function resolveCommissionBps(kind: BookingKind): number {
  return DEFAULT_COMMISSION_BPS[kind];
}

export function buildCommissionSnapshot(
  kind: BookingKind,
  now: Date = new Date(),
): CommissionSnapshot {
  return {
    commissionType: kind,
    rateBps: resolveCommissionBps(kind),
    ruleVersion: COMMISSION_RULE_VERSION,
    ruleId: null,
    effectiveFrom: null,
    snapshotAt: now.toISOString(),
  };
}
