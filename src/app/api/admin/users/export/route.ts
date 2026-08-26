import { NextResponse } from "next/server";
import { getUsers } from "@/lib/data/users";
import { requireAdminApi } from "@/lib/admin-auth";

/**
 * Full admin check — signature, expiry AND revocation. Identical to what every
 * other admin surface enforces, so this route is not a weaker side door.
 */
async function isAuthed(): Promise<boolean> {
  return (await requireAdminApi()) !== null;
}

export async function GET() {
  if (!(await isAuthed())) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const users = await getUsers();
  users.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const header = ["Name", "Email", "Signup method", "Saved villas", "Joined"];
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    header.map(escape).join(","),
    ...users.map((u) =>
      [
        u.name,
        u.email,
        u.passwordHash === "google::oauth" ? "Google" : "Email",
        String(u.wishlist?.length ?? 0),
        u.createdAt,
      ]
        .map(escape)
        .join(","),
    ),
  ];

  const csv = lines.join("\n");
  const filename = `earthystays-users-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
