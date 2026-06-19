import { NextResponse } from "next/server";
import { z } from "zod";
import { appendJson } from "@/lib/storage";

export type InquiryStatus = "new" | "open" | "shared" | "closed";

export type StoredInquiry = {
  id: string;
  kind?: "guest" | "partner" | "callback" | "experience"; // "guest" default booking inquiry; "partner" villa owner pitch; "callback" quick "call me back"; "experience" concierge experience lead
  status?: InquiryStatus; // defaults to "new" when missing
  name: string;
  phone: string;
  email?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  adults?: number;
  children?: number;
  infants?: number;
  rooms?: number;
  message?: string;
  villa?: string;
  // Partner-inquiry-specific fields:
  city?: string;
  propertyType?: string; // "1 villa" | "2-5 villas" | "Apartment(s)" | etc.
  createdAt: string;
  updatedAt?: string;
  note?: string; // internal team note (e.g. "shared 3 options on whatsapp")
};

const InquirySchema = z.object({
  kind: z.enum(["guest", "partner", "callback", "experience"]).optional(),
  name: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email().optional().or(z.literal("")),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  guests: z.coerce.number().int().min(0).max(80).optional(),
  adults: z.coerce.number().int().min(0).max(40).optional(),
  children: z.coerce.number().int().min(0).max(40).optional(),
  infants: z.coerce.number().int().min(0).max(20).optional(),
  rooms: z.coerce.number().int().min(0).max(20).optional(),
  message: z.string().optional(),
  villa: z.string().optional(),
  city: z.string().optional(),
  propertyType: z.string().optional(),
});

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = InquirySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Validation failed", issues: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const d = parsed.data;
  const inquiry: StoredInquiry = {
    id: `inq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    kind: d.kind ?? "guest",
    name: d.name,
    phone: d.phone,
    email: d.email && d.email.length > 0 ? d.email : undefined,
    checkIn: d.checkIn || undefined,
    checkOut: d.checkOut || undefined,
    guests: d.guests,
    adults: d.adults,
    children: d.children,
    infants: d.infants,
    rooms: d.rooms,
    message: d.message,
    villa: d.villa,
    city: d.city,
    propertyType: d.propertyType,
    createdAt: new Date().toISOString(),
  };

  try {
    await appendJson<StoredInquiry>("inquiries.json", inquiry);
  } catch (err) {
    console.error("[inquiry] failed to persist", err);
  }

  console.log("[inquiry]", inquiry.id, inquiry.name, inquiry.phone);

  if (process.env.RESEND_API_KEY && process.env.INQUIRY_TO_EMAIL) {
    try {
      const guestBreakdown = [
        inquiry.adults !== undefined ? `${inquiry.adults}A` : null,
        inquiry.children !== undefined && inquiry.children > 0 ? `${inquiry.children}C` : null,
        inquiry.infants !== undefined && inquiry.infants > 0 ? `${inquiry.infants}I` : null,
      ]
        .filter(Boolean)
        .join(" + ");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.INQUIRY_FROM_EMAIL ?? "Earthy Stays <onboarding@resend.dev>",
          to: process.env.INQUIRY_TO_EMAIL,
          subject: `New inquiry from ${inquiry.name}${inquiry.villa ? ` · ${inquiry.villa}` : ""}`,
          text: [
            `Name:     ${inquiry.name}`,
            `Phone:    ${inquiry.phone}`,
            `Email:    ${inquiry.email ?? "—"}`,
            `Villa:    ${inquiry.villa ?? "—"}`,
            `Guests:   ${guestBreakdown || inquiry.guests || "—"}${inquiry.rooms ? ` · ${inquiry.rooms} room${inquiry.rooms === 1 ? "" : "s"}` : ""}`,
            `Check-in: ${inquiry.checkIn ?? "—"}`,
            `Check-out:${inquiry.checkOut ?? "—"}`,
            "",
            inquiry.message ?? "(no message)",
          ].join("\n"),
        }),
      });
    } catch (err) {
      console.error("[inquiry] email send failed", err);
    }
  }

  return NextResponse.json({ ok: true });
}
