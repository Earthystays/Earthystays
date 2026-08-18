import { track } from "@/lib/analytics";

/**
 * Fire a WhatsApp click beacon before the browser navigates to wa.me.
 * Uses `navigator.sendBeacon` when available — the request survives the
 * page unload that follows the WhatsApp link — with a small fetch fallback.
 * Errors are swallowed on purpose so a broken tracker never blocks the
 * primary WhatsApp navigation. Also fires a GA4 + Meta Pixel "Contact"
 * event so WhatsApp outreach shows up in both ad platforms' conversions.
 */
export function trackWhatsAppClick(source: string, villa?: string): void {
  if (typeof window === "undefined") return;
  track("Contact", { method: "whatsapp", source, ...(villa ? { villa } : {}) });
  const body = JSON.stringify({ source, ...(villa ? { villa } : {}) });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon("/api/track/whatsapp-click", blob);
      return;
    }
  } catch {
    // fall through to fetch
  }
  try {
    void fetch("/api/track/whatsapp-click", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    // swallow — tracking must never block the outbound WhatsApp click
  }
}
