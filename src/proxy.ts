import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, verifyAdminSession } from "@/lib/admin-session";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow the login page + logout endpoint without auth
  if (path === "/admin/login" || path === "/api/admin/logout") {
    return NextResponse.next();
  }

  // Stateless half of the check: signature + expiry. Revocation needs the
  // filesystem, so it is enforced in Node by `requireAdmin()` — which every
  // admin page (via the dashboard layout) and every /api/admin route calls.
  const session = await verifyAdminSession(req.cookies.get(ADMIN_COOKIE)?.value);

  if (!session) {
    // API callers get a bare 401 rather than an HTML redirect, and no hint
    // about whether the token was missing, malformed, or expired.
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/admin/login", req.url);
    if (path !== "/admin") url.searchParams.set("next", path);
    const res = NextResponse.redirect(url);
    // Clear a stale/expired cookie so the browser stops sending it.
    res.cookies.delete(ADMIN_COOKIE);
    return res;
  }

  return NextResponse.next();
}

// Match all /admin/* pages and /api/admin/* except /api/admin/upload.
// Upload is excluded to bypass the proxy's 10MB body cap; the route handler
// itself enforces the *full* check via `requireAdminApi()`.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/((?!upload).*)"],
};
