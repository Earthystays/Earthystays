import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Server-side mirror of the client-side Meta Pixel events fired from
 * lib/analytics.ts. Sending the same `event_id` from both sides lets Meta
 * deduplicate the browser + server pings into a single conversion, while
 * the server copy survives ad blockers and iOS tracking prevention.
 *
 * No-ops (200, ok:false) when FB_ACCESS_TOKEN / FB_PIXEL_ID aren't set, so
 * callers never need to branch on whether CAPI is configured.
 */

const Schema = z.object({
  event: z.enum(["Lead", "Contact"]),
  eventId: z.string().min(1).max(200),
  email: z.string().trim().max(320).optional(),
  phone: z.string().trim().max(40).optional(),
  eventSourceUrl: z.string().url().optional(),
  customData: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Meta requires lowercased, trimmed email hashes. */
function hashEmail(email: string): string {
  return sha256(email.trim().toLowerCase());
}

/** Meta requires digits-only phone (with country code, no leading +/0s) before hashing. */
function hashPhone(phone: string): string {
  return sha256(phone.replace(/\D/g, ""));
}

export async function POST(req: Request) {
  const accessToken = process.env.FB_ACCESS_TOKEN;
  const pixelId = process.env.FB_PIXEL_ID;
  if (!accessToken || !pixelId) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  const d = parsed.data;
  const userData: Record<string, unknown> = {
    client_ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    client_user_agent: req.headers.get("user-agent") ?? undefined,
  };
  if (d.email) userData.em = [hashEmail(d.email)];
  if (d.phone) userData.ph = [hashPhone(d.phone)];

  const payload = {
    data: [
      {
        event_name: d.event,
        event_time: Math.floor(Date.now() / 1000),
        event_id: d.eventId,
        action_source: "website",
        event_source_url: d.eventSourceUrl,
        user_data: userData,
        custom_data: d.customData,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("[meta-capi] Meta rejected event", res.status, await res.text());
      return NextResponse.json({ ok: false }, { status: 502 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[meta-capi] failed to forward event", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
