import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyState } from "@/lib/oauth-state";
import { findUserByEmail, createUser } from "@/lib/data/users";
import { signSession } from "@/lib/user-auth";
import { USER_COOKIE } from "@/lib/session";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  if (errorParam) {
    return NextResponse.redirect(new URL(`/login?googleError=${errorParam}`, req.url));
  }
  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?googleError=invalid-callback", req.url));
  }

  const next = verifyState(state);
  if (!next) {
    return NextResponse.redirect(new URL("/login?googleError=bad-state", req.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/login?googleError=not-configured", req.url));
  }

  // Exchange auth code for tokens
  let tokens: { access_token?: string; id_token?: string };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${url.origin}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }).toString(),
    });
    if (!tokenRes.ok) throw new Error("token exchange failed");
    tokens = await tokenRes.json();
  } catch {
    return NextResponse.redirect(new URL("/login?googleError=token-exchange", req.url));
  }
  if (!tokens.access_token) {
    return NextResponse.redirect(new URL("/login?googleError=no-token", req.url));
  }

  // Fetch profile
  let profile: { email?: string; name?: string };
  try {
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) throw new Error("userinfo failed");
    profile = await profileRes.json();
  } catch {
    return NextResponse.redirect(new URL("/login?googleError=profile-fetch", req.url));
  }

  if (!profile.email) {
    return NextResponse.redirect(new URL("/login?googleError=no-email", req.url));
  }

  // Find or create user
  let user = await findUserByEmail(profile.email);
  if (!user) {
    user = await createUser({
      email: profile.email,
      name: profile.name || profile.email.split("@")[0],
      passwordHash: "google::oauth", // no local password — only Google login
    });
  }

  // Sign session
  const c = await cookies();
  c.set(USER_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
    secure: process.env.NODE_ENV === "production",
  });

  return NextResponse.redirect(new URL(next, req.url));
}
