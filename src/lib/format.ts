export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNight(value: number) {
  return `${formatINR(value)} / night`;
}

/** Compact Indian format used on metric cards: ₹1.45L below ₹1L falls
 *  back to the full formatted amount. */
export function formatINRCompact(n: number) {
  if (n >= 100000) {
    const l = n / 100000;
    return `₹${l >= 10 ? Math.round(l) : Math.round(l * 100) / 100}L`;
  }
  return formatINR(n);
}
