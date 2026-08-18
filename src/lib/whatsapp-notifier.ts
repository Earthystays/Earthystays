/**
 * WhatsApp notification helper. Fires a message to the admin's phone
 * whenever a guest submits an inquiry.
 *
 * Two providers, checked in order:
 *
 * 1. Meta WhatsApp Cloud API (official) — used when these are set:
 *      WHATSAPP_CLOUD_TOKEN     — permanent System User access token
 *      WHATSAPP_CLOUD_PHONE_ID  — the sender's "Phone number ID"
 *      WHATSAPP_NOTIFY_PHONE    — admin phone, country code, no plus
 *    Sends the approved "new_inquiry" template (business-initiated
 *    messages must use a template). Template registered via the
 *    Graph API — see docs/whatsapp-notifications.md.
 *
 * 2. CallMeBot (legacy fallback) — used when only these are set:
 *      WHATSAPP_NOTIFY_PHONE
 *      WHATSAPP_NOTIFY_APIKEY
 *
 * No-op when neither provider is configured, so the site keeps
 * working without WhatsApp.
 */

import type { StoredInquiry } from "@/app/api/inquiries/route";

const CALLMEBOT_ENDPOINT = "https://api.callmebot.com/whatsapp.php";
const GRAPH_VERSION = "v21.0";
const TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME ?? "new_inquiry";

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
  if (!phone) return;

  const cloudToken = process.env.WHATSAPP_CLOUD_TOKEN;
  const cloudPhoneId = process.env.WHATSAPP_CLOUD_PHONE_ID;
  if (cloudToken && cloudPhoneId) {
    await sendViaCloudApi(inquiry, phone, cloudToken, cloudPhoneId);
    return;
  }

  const apiKey = process.env.WHATSAPP_NOTIFY_APIKEY;
  if (apiKey) await sendViaCallMeBot(inquiry, phone, apiKey);
}

/* ------------------------- Meta Cloud API ------------------------- */

/**
 * Template body registered with Meta (category UTILITY, language en):
 *
 *   🔔 {{1}} — Earthy Stays
 *   Name: {{2}}
 *   Phone: {{3}}
 *   Villa: {{4}}
 *   Dates: {{5}}
 *   Guests: {{6}}
 *   Message: {{7}}
 *
 *   Open: https://earthystays.com/admin/inquiries
 *
 * Template parameters may not be empty or contain newlines, so blanks
 * become "—" and the free-text message is flattened to one line.
 */
async function sendViaCloudApi(
  inquiry: StoredInquiry,
  to: string,
  token: string,
  phoneId: string,
): Promise<void> {
  const params = buildTemplateParams(inquiry);
  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: TEMPLATE_NAME,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: params.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      },
    );
    if (!res.ok) {
      console.error(
        "[inquiry] whatsapp cloud api returned",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (err) {
    console.error("[inquiry] whatsapp cloud api failed", err);
  }
}

function buildTemplateParams(inquiry: StoredInquiry): string[] {
  const label = LABELS[inquiry.kind ?? "guest"];

  const dates =
    [inquiry.checkIn, inquiry.checkOut].filter(Boolean).join(" → ") || "—";

  const guestParts: string[] = [];
  if (inquiry.adults !== undefined) guestParts.push(`${inquiry.adults}A`);
  if (inquiry.children !== undefined && inquiry.children > 0)
    guestParts.push(`${inquiry.children}C`);
  if (inquiry.infants !== undefined && inquiry.infants > 0)
    guestParts.push(`${inquiry.infants}I`);
  let guests = guestParts.join(" + ") || String(inquiry.guests ?? "") || "—";
  if (inquiry.rooms !== undefined && inquiry.rooms > 0)
    guests += ` · ${inquiry.rooms} room${inquiry.rooms === 1 ? "" : "s"}`;

  // Partner inquiries have no villa; surface city/type there instead.
  const villa =
    inquiry.villa ??
    [inquiry.city, inquiry.propertyType].filter(Boolean).join(" · ") ??
    "—";

  return [
    label,
    sanitizeParam(inquiry.name),
    sanitizeParam(inquiry.phone),
    sanitizeParam(villa || "—"),
    dates,
    guests,
    sanitizeParam(inquiry.message ?? "—"),
  ];
}

/** Template params may not be empty or contain newlines/tabs/4+ spaces. */
function sanitizeParam(value: string): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > 0 ? flat.slice(0, 900) : "—";
}

/* ------------------------- CallMeBot (legacy) ------------------------- */

async function sendViaCallMeBot(
  inquiry: StoredInquiry,
  phone: string,
  apiKey: string,
): Promise<void> {
  const message = buildFreeformMessage(inquiry);

  const url = `${CALLMEBOT_ENDPOINT}?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(
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

function buildFreeformMessage(inquiry: StoredInquiry): string {
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
