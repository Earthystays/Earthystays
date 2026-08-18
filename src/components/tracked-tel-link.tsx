"use client";

import type { ReactNode } from "react";
import { track } from "@/lib/analytics";

/**
 * Thin client-side wrapper around a `tel:` <a> that fires a GA4 + Meta
 * Pixel "Contact" event before the OS dialer opens. Pass `source`
 * (e.g. "footer", "header-mobile", "villa-sidebar") to differentiate origins.
 */
export function TrackedTelLink({
  href,
  source,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  source: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      aria-label={ariaLabel}
      onClick={() => track("Contact", { method: "phone", source })}
      className={className}
    >
      {children}
    </a>
  );
}
