import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { USER_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  const c = await cookies();
  c.delete(USER_COOKIE);
  // Overwrite with an already-expired cookie too, so a browser holding one
  // scoped slightly differently still drops it.
  c.set(USER_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
