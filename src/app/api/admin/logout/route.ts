import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const c = await cookies();
  c.delete(ADMIN_COOKIE);
  return NextResponse.redirect(new URL("/admin/login", req.url), { status: 303 });
}
