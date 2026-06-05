import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const c = await cookies();
  c.delete(USER_COOKIE);
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
