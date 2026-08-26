"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  AdminConfigError,
  adminCookieOptions,
  checkAdminPassword,
  createAdminSession,
} from "@/lib/admin-auth";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  clientKeyFromHeaders,
  recordLoginFailure,
} from "@/lib/admin-rate-limit";
import { logAdminAction } from "@/lib/admin-audit";

export type LoginState = { ok: boolean; error?: string };

/** Generic message — never reveals whether the password or the config was wrong. */
const GENERIC_FAILURE = "Wrong password";

function lockoutMessage(seconds: number): string {
  const minutes = Math.ceil(seconds / 60);
  return `Too many attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`;
}

export async function login(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  // Only same-origin admin paths — "//evil.com" is not a relative path.
  const safeNext =
    next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin";

  const clientKey = clientKeyFromHeaders(await headers());

  const limit = checkLoginRateLimit(clientKey);
  if (!limit.allowed) {
    return { ok: false, error: lockoutMessage(limit.retryAfterSeconds) };
  }

  let passwordOk: boolean;
  try {
    passwordOk = checkAdminPassword(password);
  } catch (err) {
    if (err instanceof AdminConfigError) {
      // Misconfigured server. Log for the operator; tell the browser nothing
      // beyond "unavailable" so the failure mode isn't a fingerprint.
      console.error("[admin-login] configuration error:", err.message);
      return {
        ok: false,
        error: "Admin sign-in is unavailable. Contact the site administrator.",
      };
    }
    throw err;
  }

  if (!passwordOk) {
    const after = recordLoginFailure(clientKey);
    await logAdminAction({
      action: "admin.login_failed",
      summary: "Failed admin sign-in attempt",
    });
    return {
      ok: false,
      error: after.allowed
        ? GENERIC_FAILURE
        : lockoutMessage(after.retryAfterSeconds),
    };
  }

  clearLoginAttempts(clientKey);

  // A fresh session id on every login — an attacker cannot pre-seed a cookie
  // value and have it become authenticated (session fixation).
  const { token, session } = await createAdminSession();
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, adminCookieOptions(ADMIN_SESSION_MAX_AGE_SECONDS));

  await logAdminAction({
    action: "admin.login",
    summary: "Admin signed in",
    sid: session.sid,
  });

  redirect(safeNext);
}
