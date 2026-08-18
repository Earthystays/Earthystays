import { NextResponse } from "next/server";
import { signState } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.redirect(new URL("/login?googleError=not-configured", req.url));
  }

  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/";

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${url.origin}/api/auth/google/callback`;

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("state", signState(next));
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");

  return NextResponse.redirect(authUrl);
}
