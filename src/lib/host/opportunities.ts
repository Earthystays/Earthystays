/**
 * Opportunities — concrete, actionable observations for an owner.
 *
 * HARD RULE: every opportunity is a statement of something measured. No
 * predicted revenue, no "you could earn ₹X", no invented benchmarks. If the
 * data can't support a claim, the opportunity is simply not generated — an
 * empty list is a valid, honest result.
 */
import type { HostData } from "@/lib/host-metrics";
import {
  contentGaps,
  openNightsAhead,
  type PropertyPerformance,
} from "./property-performance";

export type Opportunity = {
  id: string;
  /** Drives the icon and accent. */
  kind: "action" | "content" | "demand" | "calendar";
  title: string;
  detail: string;
  href: string;
  cta: string;
  /** Lower sorts first — things a guest is waiting on come before nice-to-haves. */
  priority: number;
};

/** A listing needs a meaningful sample before conversion means anything. */
const MIN_VIEWS_FOR_CONVERSION = 30;
/** Below this, views aren't turning into inquiries at a healthy rate. */
const LOW_CONVERSION_PCT = 2;
/** Only mention open dates when there are enough to act on. */
const OPEN_NIGHTS_THRESHOLD = 7;

export function buildOpportunities(
  data: HostData,
  performance: PropertyPerformance[],
): Opportunity[] {
  const out: Opportunity[] = [];

  /* ── Guests are waiting: highest priority, always actionable ── */
  if (data.pending.length > 0) {
    out.push({
      id: "pending-requests",
      kind: "action",
      title: `${data.pending.length} booking ${
        data.pending.length === 1 ? "request needs" : "requests need"
      } your response`,
      detail:
        "Guests are waiting on you. Responding quickly is the single biggest thing you control.",
      href: "/host/bookings",
      cta: "Review requests",
      priority: 0,
    });
  }

  if (data.unreadMessages > 0) {
    out.push({
      id: "unread-messages",
      kind: "action",
      title: `${data.unreadMessages} unread ${
        data.unreadMessages === 1 ? "message" : "messages"
      }`,
      detail: "Guests with unanswered questions rarely book.",
      href: "/host/inbox",
      cta: "Open inbox",
      priority: 1,
    });
  }

  /* ── Calendar: real open nights in the next 30 days ── */
  const open = openNightsAhead(data, 30).filter(
    (o) => o.open >= OPEN_NIGHTS_THRESHOLD,
  );
  if (open.length === 1) {
    out.push({
      id: `open-${open[0].slug}`,
      kind: "calendar",
      title: `${open[0].open} of the next 30 nights are open at ${open[0].name}`,
      detail:
        "Check your rates and minimum-stay rules for these dates, or block them if you're using the property yourself.",
      href: "/host/calendar",
      cta: "Open calendar",
      priority: 3,
    });
  } else if (open.length > 1) {
    const total = open.reduce((n, o) => n + o.open, 0);
    out.push({
      id: "open-multi",
      kind: "calendar",
      title: `${total} open nights across ${open.length} properties in the next 30 days`,
      detail: open.map((o) => `${o.name}: ${o.open}`).join(" · "),
      href: "/host/calendar",
      cta: "Open calendar",
      priority: 3,
    });
  }

  /* ── Demand: measured views vs measured inquiries ── */
  for (const p of performance) {
    if (
      p.views >= MIN_VIEWS_FOR_CONVERSION &&
      p.conversion !== null &&
      p.conversion < LOW_CONVERSION_PCT
    ) {
      out.push({
        id: `conversion-${p.slug}`,
        kind: "demand",
        title: `${p.name} has high views but few inquiries`,
        detail: `${p.views} views in the last 30 days produced ${p.inquiries} ${
          p.inquiries === 1 ? "inquiry" : "inquiries"
        }. Guests are finding the listing but not acting on it — photos, pricing and the opening description are the usual causes.`,
        href: `/host/listings/${p.slug}/edit`,
        cta: "Review listing",
        priority: 4,
      });
    }
  }

  /* ── Content completeness: specific, never vague ── */
  for (const gap of contentGaps(data.listings)) {
    out.push({
      id: `content-${gap.slug}`,
      kind: "content",
      title: `${gap.name} is missing listing detail`,
      detail: `This listing has ${gap.reasons.join(", ")}. More complete listings give guests fewer reasons to hesitate.`,
      href: `/host/listings/${gap.slug}/edit`,
      cta: "Complete listing",
      priority: 5,
    });
  }

  return out.sort((a, b) => a.priority - b.priority);
}
