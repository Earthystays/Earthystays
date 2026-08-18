import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUsers } from "@/lib/data/users";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return token === (await adminToken());
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
