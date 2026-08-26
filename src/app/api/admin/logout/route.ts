import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  adminCookieOptions,
  getAdminSession,
  revokeAdminSession,
} from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";

export async function POST(req: Request) {
  // Revoke server-side first, so the token is dead even if a copy of the
  // cookie was captured before logout.
  const session = await getAdminSession();
  if (session) {
    await revokeAdminSession(session);
    await logAdminAction({
      action: "admin.logout",
      summary: "Admin signed out",
      sid: session.sid,
    });
  }

  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  // Overwrite with an already-expired cookie too: `delete` alone can be
  // ignored if the browser holds one scoped differently.
  jar.set(ADMIN_COOKIE, "", adminCookieOptions(0));

  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
