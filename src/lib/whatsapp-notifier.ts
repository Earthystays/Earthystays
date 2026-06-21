/**
 * WhatsApp notification helper. Fires a message to the admin's phone
 * whenever a guest submits an inquiry. Uses CallMeBot — a free service
 * built for exactly this use case (server → one specific human's
 * WhatsApp). No Meta business verification, no template approval.
 *
 * Set these env vars to enable:
 *   WHATSAPP_NOTIFY_PHONE  — admin phone with country code, no plus,
 *                            no spaces. e.g. "919657100004"
 *   WHATSAPP_NOTIFY_APIKEY — CallMeBot API key (issued after the
 *                            admin texts CallMeBot from their phone)
 *
 * Setup steps documented in docs/whatsapp-notifications.md.
 *
 * No-op when either env var is unset, so the site keeps working
 * without WhatsApp configured.
 */

import type { StoredInquiry } from "@/app/api/inquiries/route";

const ENDPOINT = "https://api.callmebot.com/whatsapp.php";

const LABELS: Record<NonNullable<StoredInquiry["kind"]>, string> = {
  guest: "Booking inquiry",
  partner: "Partner inquiry",
  callback: "Callback request",
  experience: "Experience inquiry",
};

export async function notifyInquiryToWhatsApp(
  inquiry: StoredInquiry,
): Promise<void> {
  const phone = process.env.WHATSAPP_NOTIFY_PHONE;
  const apiKey = process.env.WHATSAPP_NOTIFY_APIKEY;
  if (!phone || !apiKey) return;

  const message = buildMessage(inquiry);

  const url = `${ENDPOINT}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(
    message,
  )}&apikey=${encodeURIComponent(apiKey)}`;

  try {
    const res = await fetch(url, { method: "GET" });
    if (!res.ok) {
      console.error(
        "[inquiry] callmebot returned",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[inquiry] whatsapp notify failed", err);
  }
}

function buildMessage(inquiry: StoredInquiry): string {
  const label = LABELS[inquiry.kind ?? "guest"];
  const lines: string[] = [];
  lines.push(`🔔 ${label} — Earthy Stays`);
  lines.push("");
  lines.push(`Name: ${inquiry.name}`);
  lines.push(`Phone: ${inquiry.phone}`);
  if (inquiry.email) lines.push(`Email: ${inquiry.email}`);
  if (inquiry.villa) lines.push(`Villa: ${inquiry.villa}`);
  if (inquiry.city) lines.push(`City: ${inquiry.city}`);
  if (inquiry.propertyType) lines.push(`Type: ${inquiry.propertyType}`);

  const dates = [inquiry.checkIn, inquiry.checkOut].filter(Boolean).join(" → ");
  if (dates) lines.push(`Dates: ${dates}`);

  const guestParts: string[] = [];
  if (inquiry.adults !== undefined) guestParts.push(`${inquiry.adults}A`);
  if (inquiry.children !== undefined && inquiry.children > 0)
    guestParts.push(`${inquiry.children}C`);
  if (inquiry.infants !== undefined && inquiry.infants > 0)
    guestParts.push(`${inquiry.infants}I`);
  if (guestParts.length > 0) lines.push(`Guests: ${guestParts.join(" + ")}`);
  if (inquiry.rooms !== undefined && inquiry.rooms > 0)
    lines.push(`Rooms: ${inquiry.rooms}`);

  if (inquiry.message) {
    lines.push("");
    lines.push(`Message: ${inquiry.message}`);
  }

  lines.push("");
  lines.push(`Open: https://earthystays.com/admin/inquiries`);

  return lines.join("\n");
}
