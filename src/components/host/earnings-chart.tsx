import { formatINR } from "@/lib/host-metrics";

/** Cumulative earnings line for one month, server-rendered SVG.
 *  Styled after the dashboard mock: sage line, soft gradient fill. */
export function EarningsChart({ daily }: { daily: number[] }) {
  const W = 520;
  const H = 190;
  const PAD_L = 46;
  const PAD_B = 22;
  const PAD_T = 8;

  const cumulative: number[] = [];
  daily.reduce((sum, v, i) => {
    const s = sum + v;
    cumulative[i] = s;
    return s;
  }, 0);
  const max = Math.max(...cumulative, 1);
  // Round the axis top up to a clean ₹50K step.
  const step = 50000;
  const top = Math.max(step, Math.ceil(max / step) * step);

  const x = (i: number) => PAD_L + (i / (daily.length - 1)) * (W - PAD_L - 8);
  const y = (v: number) => PAD_T + (1 - v / top) * (H - PAD_T - PAD_B);

  const points = cumulative.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = points.join(" ");
  const area = `${PAD_L},${y(0)} ${line} ${x(daily.length - 1).toFixed(1)},${y(0)}`;

  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const fmtTick = (v: number) => (v === 0 ? "₹0" : `₹${v / 1000}K`);

  const monthShort = "Jul"; // label style only; dates below use indices
  const xLabels = [1, 8, 15, 22, daily.length].map((d) => ({ d, i: d - 1 }));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="mt-4 w-full" role="img" aria-label={`Earnings this month, total ${formatINR(cumulative[cumulative.length - 1] ?? 0)}`}>
      <defs>
        <linearGradient id="earn-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {ticks.map((v) => (
        <g key={v}>
          <line x1={PAD_L} x2={W - 8} y1={y(v)} y2={y(v)} stroke="var(--border)" strokeOpacity="0.6" strokeWidth="1" />
          <text x={PAD_L - 8} y={y(v) + 3.5} textAnchor="end" fontSize="10" fill="var(--muted-foreground)">
            {fmtTick(v)}
          </text>
        </g>
      ))}
      <polygon points={area} fill="url(#earn-fill)" />
      <polyline points={line} fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {xLabels.map(({ d, i }) => (
        <text key={d} x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted-foreground)">
          {d} {monthShort}
        </text>
      ))}
    </svg>
  );
}

/** Occupancy donut with centered % and delta caption, matching the mock. */
export function OccupancyDonut({ pct, delta }: { pct: number; delta: number }) {
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const filled = (Math.min(Math.max(pct, 0), 100) / 100) * CIRC;

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 140 140" className="w-full max-w-[170px]" role="img" aria-label={`Occupancy ${pct}%`}>
        <circle cx="70" cy="70" r={R} fill="none" stroke="var(--muted)" strokeWidth="13" />
        <circle
          cx="70"
          cy="70"
          r={R}
          fill="none"
          stroke="var(--primary)"
          strokeWidth="13"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC - filled}`}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="78" textAnchor="middle" fontSize="28" fontWeight="600" fill="var(--foreground)">
          {pct}%
        </text>
      </svg>
      <p className={`mt-1 text-sm font-medium ${delta >= 0 ? "text-emerald-700" : "text-destructive"}`}>
        {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
      </p>
      <p className="text-xs text-muted-foreground">vs last month</p>
    </div>
  );
}
