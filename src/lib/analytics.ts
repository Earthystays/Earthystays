declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export type AnalyticsParams = Record<string, string | number | boolean | undefined>;

/** Meta Pixel + GA4 both understand these names; keep the vocabulary shared
 *  between client events and the server-side Conversions API payload. */
export type AnalyticsEvent = "Contact" | "Lead" | "ViewContent" | "Search";

function generateEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fires one event to GA4 and Meta Pixel together. Returns the generated
 * event_id — pass this to /api/meta-capi as `eventId` on the matching
 * server-side event so Meta deduplicates the browser + server pings.
 * Safe to call before either script has loaded (gtag/fbq calls just queue).
 */
export function track(event: AnalyticsEvent, params: AnalyticsParams = {}): string {
  const eventId = generateEventId();
  if (typeof window === "undefined") return eventId;

  try {
    window.gtag?.("event", event, params);
  } catch {
    // analytics must never break the page
  }

  try {
    window.fbq?.("track", event, params, { eventID: eventId });
  } catch {
    // analytics must never break the page
  }

  return eventId;
}
