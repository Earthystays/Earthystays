import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE, adminToken } from "@/lib/admin-auth";

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Allow the login page + logout endpoint without auth
  if (path === "/admin/login" || path === "/api/admin/logout") {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(ADMIN_COOKIE);
  const expected = await adminToken();
  if (cookie?.value !== expected) {
    const url = new URL("/admin/login", req.url);
    if (path !== "/admin") url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Match all /admin/* pages and /api/admin/* except /api/admin/upload.
// Upload is excluded to bypass the proxy's 10MB body cap; the route
// handler itself enforces auth via cookie check.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/((?!upload).*)"],
};
