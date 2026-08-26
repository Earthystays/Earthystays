import { NextResponse } from "next/server";
import { readJson } from "@/lib/storage";
import { requireAdminApi } from "@/lib/admin-auth";
import type { StoredInquiry } from "@/app/api/inquiries/route";

/**
 * Full admin check — signature, expiry AND revocation. Identical to what every
 * other admin surface enforces, so this route is not a weaker side door.
 */
async function isAuthed(): Promise<boolean> {
  return (await requireAdminApi()) !== null;
}

function normalizeStatusLabel(s?: StoredInquiry["status"]): string {
  const raw = s ?? "new";
  if (raw === "shared") return "Quote Sent";
  if (raw === "closed") return "Booked";
  const map: Record<string, string> = {
    new: "New",
    open: "Open",
    "quote-sent": "Quote Sent",
    negotiating: "Negotiating",
    booked: "Booked",
    lost: "Lost",
  };
  return map[raw] ?? raw;
}

function sourceLabel(kind?: StoredInquiry["kind"]): string {
  const k = kind ?? "guest";
  if (k === "callback") return "WhatsApp";
  if (k === "partner") return "Partner";
  if (k === "experience") return "Concierge";
  return "Website";
}

export async function GET() {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const list = await readJson<StoredInquiry[]>("inquiries.json", []);
  list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const header = [
    "Guest",
    "Phone",
    "Email",
    "Property",
    "Check-in",
    "Check-out",
    "Guests",
    "Rooms",
    "Status",
    "Source",
    "Note",
    "Created",
  ];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const rows = list.map((q) =>
    [
      q.name,
      q.phone,
      q.email ?? "",
      q.villa ?? "",
      q.checkIn ?? "",
      q.checkOut ?? "",
      String(q.adults ?? q.guests ?? ""),
      String(q.rooms ?? ""),
      normalizeStatusLabel(q.status),
      sourceLabel(q.kind),
      q.note ?? "",
      q.createdAt,
    ]
      .map(escape)
      .join(","),
  );

  const csv = [header.map(escape).join(","), ...rows].join("\n");
  const filename = `earthystays-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
