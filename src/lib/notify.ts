import { findUserById } from "@/lib/data/users";
import type { Villa } from "@/lib/types";
import type { StoredInquiry } from "@/app/api/inquiries/route";

/**
 * Outbound notifications (email via Resend), all fire-and-forget and
 * env-gated: without RESEND_API_KEY nothing sends and nothing breaks —
 * the same contract as the existing inquiry email in /api/inquiries.
 *
 * Required env: RESEND_API_KEY. Optional: INQUIRY_FROM_EMAIL (sender).
 */

/** Production origin for links in emails (req.url is unreliable behind Nginx). */
export function appOrigin(): string {
  if (process.env.GOOGLE_REDIRECT_URI) {
    try {
      return new URL(process.env.GOOGLE_REDIRECT_URI).origin;
    } catch {
      /* fall through */
    }
  }
  return "http://localhost:3001";
}

export async function sendEmail(to: string, subject: string, lines: string[]): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.INQUIRY_FROM_EMAIL ?? "Earthy Stays <onboarding@resend.dev>",
        to,
        subject,
        text: lines.join("\n"),
      }),
    });
  } catch (err) {
    console.error("[notify] email send failed", err);
  }
}

function fmtStay(q: StoredInquiry): string {
  const bits = [
    q.checkIn && q.checkOut ? `${q.checkIn} → ${q.checkOut}` : "Dates flexible",
    q.guests ? `${q.guests} guest${q.guests === 1 ? "" : "s"}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

/** New booking request landed on a host-managed listing → tell the host. */
export async function notifyHostOfBookingRequest(villa: Villa, inquiry: StoredInquiry): Promise<void> {
  if (!villa.hostId) return;
  const host = await findUserById(villa.hostId);
  if (!host) return;
  await sendEmail(host.email, `New booking request — ${villa.name}`, [
    `${inquiry.name} wants to stay at ${villa.name}.`,
    fmtStay(inquiry),
    inquiry.message ? `"${inquiry.message}"` : "",
    "",
    `Accept or decline: ${appOrigin()}/host/bookings`,
    "The Earthy Stays concierge sees this request alongside you.",
  ]);
}

/** Host accepted/declined → tell the guest. */
export async function notifyGuestOfDecision(
  villa: Villa,
  inquiry: StoredInquiry,
  decision: "accepted" | "declined",
): Promise<void> {
  const guest = inquiry.guestUserId ? await findUserById(inquiry.guestUserId) : undefined;
  const to = guest?.email ?? inquiry.email;
  if (!to) return;
  if (decision === "accepted") {
    await sendEmail(to, `Your dates are held — ${villa.name}`, [
      `Great news, ${inquiry.name.split(" ")[0]} — the host has accepted your request for ${villa.name}.`,
      fmtStay(inquiry),
      "",
      "The Earthy Stays concierge will contact you shortly to confirm the booking personally.",
      inquiry.guestUserId ? `Message your host: ${appOrigin()}/messages` : "",
    ]);
  } else {
    await sendEmail(to, `About your request — ${villa.name}`, [
      `Hi ${inquiry.name.split(" ")[0]}, unfortunately those dates aren't available at ${villa.name}.`,
      "",
      `Our concierge can suggest similar stays: ${appOrigin()}/villas`,
      "Or reply to this email and we'll help you personally.",
    ]);
  }
}

/**
 * New message in a thread → tell the recipient, but only when this is the
 * first unread message (they'd already seen everything before it). Keeps
 * an active back-and-forth from emailing on every line.
 */
export async function notifyNewMessage(input: {
  recipientUserId: string;
  senderName: string;
  villaName: string;
  body: string;
  recipientIsHost: boolean;
  threadId: string;
  hadUnreadBefore: boolean;
}): Promise<void> {
  if (input.hadUnreadBefore) return;
  const recipient = await findUserById(input.recipientUserId);
  if (!recipient) return;
  const link = input.recipientIsHost
    ? `${appOrigin()}/host/inbox?thread=${input.threadId}`
    : `${appOrigin()}/messages/${input.threadId}`;
  const preview = input.body.length > 120 ? `${input.body.slice(0, 120)}…` : input.body;
  await sendEmail(recipient.email, `New message from ${input.senderName} — ${input.villaName}`, [
    `${input.senderName} sent you a message about ${input.villaName}:`,
    "",
    `"${preview}"`,
    "",
    `Reply: ${link}`,
  ]);
}

/** Listing review decision → tell the host. */
export async function notifyHostOfListingReview(
  villa: Villa,
  decision: "approved" | "rejected",
  reason?: string,
): Promise<void> {
  if (!villa.hostId) return;
  const host = await findUserById(villa.hostId);
  if (!host) return;
  if (decision === "approved") {
    await sendEmail(host.email, `Your listing is live — ${villa.name}`, [
      `${villa.name} has been approved and is now live on Earthy Stays.`,
      "",
      `See it: ${appOrigin()}/villas/${villa.slug}`,
      `Manage it: ${appOrigin()}/host/listings`,
    ]);
  } else {
    await sendEmail(host.email, `Your listing needs changes — ${villa.name}`, [
      `Our team reviewed ${villa.name} and it needs a few changes before going live:`,
      "",
      reason ? `"${reason}"` : "Please review your listing details.",
      "",
      `Edit and resubmit: ${appOrigin()}/host/listings`,
    ]);
  }
}

/** Admin handed an existing listing to a host → welcome them aboard. */
export async function notifyHostOfListingAccess(
  villa: Villa,
  host: { email: string; name: string },
): Promise<void> {
  await sendEmail(host.email, `You now manage ${villa.name} on Earthy Stays`, [
    `Hi ${host.name},`,
    "",
    `The Earthy Stays team has given you host access to ${villa.name}.`,
    "You can update the listing, manage its calendar, and reply to guests from your host dashboard.",
    "",
    `Open your dashboard: ${appOrigin()}/host`,
    `See the listing: ${appOrigin()}/villas/${villa.slug}`,
    "",
    "Sign in with this email address to get started.",
  ]);
}
