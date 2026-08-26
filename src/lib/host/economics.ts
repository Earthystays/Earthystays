/**
 * Owner financial visibility.
 *
 * The commission rate comes from the finance module's own rule
 * (`resolveCommissionBps`) — never a hardcoded percentage here — so when the
 * booking/payment stream makes rates configurable or per-property, this UI
 * follows automatically.
 *
 * IMPORTANT: these are INDICATIVE figures derived from accepted inquiries
 * (nights × nightly price), matching the rest of the host area. Settled money,
 * refunds, adjustments and real payout state live in the booking/payment
 * stream's ledger. When that lands, `PropertyEconomics` is the shape it should
 * populate — the UI does not need to change.
 */
import { resolveCommissionBps } from "@/lib/finance/commission";
import type { HostBooking, HostData } from "@/lib/host-metrics";

/** Basis points → a display percentage (1500 → 15). */
export function bpsToPercent(bps: number): number {
  return bps / 100;
}

function applyBps(amount: number, bps: number): number {
  return Math.round((amount * bps) / 10_000);
}

export type PropertyEconomics = {
  slug: string;
  name: string;
  /** Indicative gross booking value. */
  grossRevenue: number;
  commissionBps: number;
  commission: number;
  /** Gross less commission. */
  ownerPayout: number;
  stays: number;
};

export type EconomicsTotals = {
  grossRevenue: number;
  commission: number;
  ownerPayout: number;
  commissionBps: number;
  stays: number;
};

/**
 * Splits indicative revenue into commission and owner payout, per property.
 *
 * @param bookings the stays to account for — callers scope this to a period.
 */
export function computeEconomics(
  data: HostData,
  bookings: HostBooking[],
): { rows: PropertyEconomics[]; totals: EconomicsTotals } {
  const commissionBps = resolveCommissionBps("property");

  const rows: PropertyEconomics[] = data.listings.map((listing) => {
    const mine = bookings.filter((b) => b.villa.slug === listing.slug);
    const grossRevenue = mine.reduce((n, b) => n + b.amount, 0);
    const commission = applyBps(grossRevenue, commissionBps);
    return {
      slug: listing.slug,
      name: listing.name,
      grossRevenue,
      commissionBps,
      commission,
      ownerPayout: grossRevenue - commission,
      stays: mine.length,
    };
  });

  const grossRevenue = rows.reduce((n, r) => n + r.grossRevenue, 0);
  const commission = rows.reduce((n, r) => n + r.commission, 0);

  return {
    rows,
    totals: {
      grossRevenue,
      commission,
      ownerPayout: grossRevenue - commission,
      commissionBps,
      stays: rows.reduce((n, r) => n + r.stays, 0),
    },
  };
}

/* ─────────────────────────── monthly history ─────────────────────────── */

export type MonthlyRevenue = {
  /** YYYY-MM */
  key: string;
  label: string;
  grossRevenue: number;
  ownerPayout: number;
  stays: number;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * Revenue for the last `months` calendar months, most recent last.
 * A stay is attributed to the month it checks out in, which is when the
 * concierge settles it.
 */
export function monthlyRevenue(
  bookings: HostBooking[],
  months = 6,
  now = new Date(),
): MonthlyRevenue[] {
  const commissionBps = resolveCommissionBps("property");
  const out: MonthlyRevenue[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const mine = bookings.filter(
      (b) => b.checkOut.getFullYear() === year && b.checkOut.getMonth() === month,
    );
    const grossRevenue = mine.reduce((n, b) => n + b.amount, 0);
    out.push({
      key: `${year}-${String(month + 1).padStart(2, "0")}`,
      label: MONTHS[month],
      grossRevenue,
      ownerPayout: grossRevenue - applyBps(grossRevenue, commissionBps),
      stays: mine.length,
    });
  }

  return out;
}

/* ─────────────────────────── payout state ─────────────────────────── */

/**
 * Payout buckets the future ledger will own.
 *
 * Today only two are derivable: a stay that has checked out is awaiting
 * settlement, and one that hasn't is upcoming. `processing`, `paid` and
 * `failed` require real payout records — they are reported as null so the UI
 * can show "not tracked yet" instead of a misleading zero.
 */
export type PayoutSummary = {
  awaitingSettlement: number;
  upcoming: number;
  processing: number | null;
  paid: number | null;
  failed: number | null;
};

export function summarisePayouts(
  bookings: HostBooking[],
  now = new Date(),
): PayoutSummary {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const commissionBps = resolveCommissionBps("property");
  const net = (list: HostBooking[]) => {
    const gross = list.reduce((n, b) => n + b.amount, 0);
    return gross - applyBps(gross, commissionBps);
  };

  return {
    awaitingSettlement: net(bookings.filter((b) => b.checkOut < today)),
    upcoming: net(bookings.filter((b) => b.checkOut >= today)),
    // Not derivable without the payment ledger — never guessed.
    processing: null,
    paid: null,
    failed: null,
  };
}
