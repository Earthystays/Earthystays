import type { ReactNode } from "react";

/**
 * Fade-up cascade for listing cards — pure CSS (keyframes in globals.css),
 * so content renders even with JS disabled or hydration pending; nothing
 * can ever be stuck invisible. `index` staggers siblings 40ms apart.
 * Animates only transform + opacity; prefers-reduced-motion disables it.
 */
export function Reveal({ index = 0, children }: { index?: number; children: ReactNode }) {
  return (
    <div
      className="card-reveal"
      style={{ animationDelay: `${Math.min(index % 8, 6) * 40}ms` }}
    >
      {children}
    </div>
  );
}
