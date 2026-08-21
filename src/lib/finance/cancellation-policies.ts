/**
 * Cancellation policies as STRUCTURED DATA (not display text). Phase 1B.5 Phase C.
 *
 * These are the LOCKED V1 definitions from the business rules. A booking
 * snapshots the resolved policy at creation; later edits to a property's live
 * policy never change an existing booking's snapshot.
 *
 * The refund/cancellation ACCOUNTING engine (ledger reversals, adjustments) is
 * a later phase. Here we only define the policy shape and the pure refund-%
 * lookup used to build the immutable snapshot.
 */

export type CancellationPolicyType = "flexible" | "moderate" | "strict";

/** One refund tier: at or beyond `minDaysBeforeCheckIn`, refund `refundBps`. */
export type RefundTier = {
  minDaysBeforeCheckIn: number;
  refundBps: number; // 10000 = 100%, 5000 = 50%, 0 = none
};

export type CancellationPolicyDef = {
  type: CancellationPolicyType;
  version: number;
  /** Ordered high→low threshold. First tier whose threshold is met applies. */
  tiers: RefundTier[];
};

/** Current policy version. Bump when the locked definitions change. */
export const CANCELLATION_POLICY_VERSION = 1;

export const CANCELLATION_POLICIES: Record<
  CancellationPolicyType,
  CancellationPolicyDef
> = {
  flexible: {
    type: "flexible",
    version: CANCELLATION_POLICY_VERSION,
    tiers: [
      { minDaysBeforeCheckIn: 7, refundBps: 10000 }, // 100% at 7+ days
      { minDaysBeforeCheckIn: 3, refundBps: 5000 }, // 50% at 3–6 days
      { minDaysBeforeCheckIn: 0, refundBps: 0 }, // 0% within 72h
    ],
  },
  moderate: {
    type: "moderate",
    version: CANCELLATION_POLICY_VERSION,
    tiers: [
      { minDaysBeforeCheckIn: 14, refundBps: 10000 }, // 100% at 14+ days
      { minDaysBeforeCheckIn: 7, refundBps: 5000 }, // 50% at 7–13 days
      { minDaysBeforeCheckIn: 0, refundBps: 0 }, // 0% within 7 days
    ],
  },
  strict: {
    type: "strict",
    version: CANCELLATION_POLICY_VERSION,
    tiers: [
      { minDaysBeforeCheckIn: 30, refundBps: 5000 }, // 50% at 30+ days
      { minDaysBeforeCheckIn: 15, refundBps: 2500 }, // 25% at 15–29 days
      { minDaysBeforeCheckIn: 0, refundBps: 0 }, // 0% within 15 days
    ],
  },
};

/**
 * Pure lookup: the refund basis points for a cancellation happening
 * `daysBeforeCheckIn` days before check-in under `type`.
 */
export function refundBpsFor(
  type: CancellationPolicyType,
  daysBeforeCheckIn: number,
): number {
  const def = CANCELLATION_POLICIES[type];
  for (const tier of def.tiers) {
    if (daysBeforeCheckIn >= tier.minDaysBeforeCheckIn) return tier.refundBps;
  }
  return 0;
}

export type CancellationPolicySnapshot = {
  policyType: CancellationPolicyType;
  version: number;
  tiers: RefundTier[];
  snapshotAt: string; // ISO timestamp
};

/** Build the immutable snapshot stored on a booking at creation. */
export function buildCancellationSnapshot(
  type: CancellationPolicyType,
  now: Date = new Date(),
): CancellationPolicySnapshot {
  const def = CANCELLATION_POLICIES[type];
  return {
    policyType: def.type,
    version: def.version,
    tiers: def.tiers.map((t) => ({ ...t })),
    snapshotAt: now.toISOString(),
  };
}
