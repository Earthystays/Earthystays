/**
 * Admin authentication — Node runtime only.
 *
 * This module touches the filesystem (revocation list), so the Edge proxy must
 * NOT import it. `proxy.ts` imports `admin-session.ts` instead, which does the
 * cheap stateless half of the check (signature + expiry). Everything that runs
 * in Node — server actions, `/api/admin/*` route handlers, the admin layout —
 * calls `requireAdmin()` here, which additionally honours revocation.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { readJson, writeJson } from "./storage";
import {
  ADMIN_COOKIE,
  AdminConfigError,
  verifyAdminSession,
  timingSafeEqual,
  type AdminSession,
} from "./admin-session";

export {
  ADMIN_COOKIE,
  AdminConfigError,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  adminCookieOptions,
} from "./admin-session";
export type { AdminSession } from "./admin-session";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Dev-only password. Unreachable in production — `adminPassword()` throws
 * there rather than falling back, so there is no guessable default to ship.
 */
const DEV_ONLY_PASSWORD = "development-only-unsafe-password";

let warnedAboutDevPassword = false;

/**
 * The configured admin password.
 *
 * @throws {AdminConfigError} in production when ADMIN_PASSWORD is unset. The
 * login screen catches this and renders a configuration error instead of
 * silently accepting a default.
 */
export function adminPassword(): string {
  const configured = process.env.ADMIN_PASSWORD;
  if (configured && configured.length > 0) return configured;

  if (IS_PRODUCTION) {
    throw new AdminConfigError(
      "ADMIN_PASSWORD is not set. The admin area is locked until it is " +
        "configured in the production environment.",
    );
  }

  if (!warnedAboutDevPassword) {
    warnedAboutDevPassword = true;
    console.warn(
      `[admin-auth] ADMIN_PASSWORD is unset — using the development-only ` +
        `password "${DEV_ONLY_PASSWORD}". This will hard-fail in production.`,
    );
  }
  return DEV_ONLY_PASSWORD;
}

/**
 * True when the admin area has everything it needs to authenticate: a password
 * to check against, and a secret to sign sessions with.
 */
export function isAdminConfigured(): boolean {
  if (IS_PRODUCTION && !process.env.SESSION_SECRET) return false;
  try {
    adminPassword();
    return true;
  } catch {
    return false;
  }
}

/**
 * Constant-time password check. Never logs, returns, or echoes the password.
 */
export function checkAdminPassword(candidate: string): boolean {
  const expected = adminPassword();
  // Pad both sides to a common width so a length difference doesn't
  // short-circuit the compare in a way an attacker could time.
  const width = Math.max(candidate.length, expected.length);
  return timingSafeEqual(
    candidate.padEnd(width, "\0"),
    expected.padEnd(width, "\0"),
  );
}

/* ─────────────────────────── revocation ─────────────────────────── */

const REVOKED_FILE = "admin-revoked-sessions.json";

type RevokedSession = { sid: string; expiresAt: number };

/**
 * Marks a session id dead. Entries are kept only until the token would have
 * expired on its own, so the file stays small.
 */
export async function revokeAdminSession(session: AdminSession): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  const existing = await readJson<RevokedSession[]>(REVOKED_FILE, []);
  const pruned = existing.filter((r) => r.expiresAt > now);
  if (!pruned.some((r) => r.sid === session.sid)) {
    pruned.push({ sid: session.sid, expiresAt: session.expiresAt });
  }
  await writeJson(REVOKED_FILE, pruned);
}

async function isRevoked(sid: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const revoked = await readJson<RevokedSession[]>(REVOKED_FILE, []);
  return revoked.some((r) => r.sid === sid && r.expiresAt > now);
}

/* ─────────────────────────── the gate ─────────────────────────── */

/**
 * Full admin check: signature, expiry, and revocation. Returns null rather
 * than throwing so callers can choose between redirecting (pages) and
 * returning 401 (APIs).
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  let session: AdminSession | null;
  try {
    const jar = await cookies();
    session = await verifyAdminSession(jar.get(ADMIN_COOKIE)?.value);
  } catch (err) {
    // A missing SESSION_SECRET in production surfaces here. Fail closed.
    if (err instanceof AdminConfigError) return null;
    throw err;
  }
  if (!session) return null;
  if (await isRevoked(session.sid)) return null;
  return session;
}

/**
 * Page/server-action guard. Redirects to the login screen when the caller is
 * not an authenticated admin, preserving where they were headed via `?next=`.
 */
export async function requireAdmin(nextPath?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  const target =
    nextPath && nextPath.startsWith("/admin") && !nextPath.startsWith("//")
      ? `/admin/login?next=${encodeURIComponent(nextPath)}`
      : "/admin/login";
  redirect(target);
}

/**
 * API-route guard. Returns the session, or null for the caller to turn into a
 * 401 — deliberately with no detail about *why* the check failed.
 */
export async function requireAdminApi(): Promise<AdminSession | null> {
  return getAdminSession();
}
