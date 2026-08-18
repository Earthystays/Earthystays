"use client";

import type { ReactNode } from "react";
import { trackWhatsAppClick } from "@/lib/track-whatsapp";

/**
 * Thin client-side wrapper around an <a> that fires a WhatsApp click beacon
 * before the browser navigates to `wa.me`. Use this anywhere a WhatsApp
 * link needs to be attributed in the admin dashboard's WhatsApp Leads
 * metric. Pass `source` (e.g. "why-section", "villa-sidebar") to
 * differentiate origins; pass `villa` (slug) on villa-specific buttons.
 */
export function TrackedWhatsAppLink({
  href,
  source,
  villa,
  className,
  children,
  ariaLabel,
}: {
  href: string;
  source: string;
  villa?: string;
  className?: string;
  children: ReactNode;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      onClick={() => trackWhatsAppClick(source, villa)}
      className={className}
    >
      {children}
    </a>
  );
}
