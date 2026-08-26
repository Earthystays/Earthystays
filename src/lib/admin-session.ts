/**
 * Admin session tokens — signed, expiring, and verifiable in BOTH the Edge
 * runtime (proxy.ts) and the Node runtime (server actions, route handlers).
 *
 * Uses Web Crypto only, so nothing here may touch `fs`, `Buffer`, or the Node
 * `crypto` module. Revocation lookups live in `admin-auth.ts` (Node-only).
 *
 * Token format:  v1.<sid>.<iat>.<exp>.<sig>
 *   sid = 128 bits of randomness, unique per login (this is what defeats
 *         session fixation: a token is never reused across logins)
 *   iat = issued-at, epoch seconds
 *   exp = expires-at, epoch seconds — checked on every request
 *   sig = base64url( HMAC-SHA256(secret, "v1.<sid>.<iat>.<exp>") )
 *
 * The token carries no secret material, so it is safe in a cookie. It is still
 * set HttpOnly + SameSite=Lax + Secure-in-production so it never reaches
 * client-side JavaScript.
 */

export const ADMIN_COOKIE = "es-admin";

/** How long an admin session stays valid. */
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours

/**
 * Thrown when required auth configuration is missing in production. Callers
 * render a configuration error rather than falling back to a default.
 */
export class AdminConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminConfigError";
  }
}

const IS_PRODUCTION = process.env.NODE_ENV === "production";

/**
 * Dev-only signing key. Never reachable in production — `sessionSecret()`
 * throws there instead. Marked loudly so it can't be mistaken for a real one.
 */
const DEV_ONLY_SECRET = "development-only-unsafe-signing-key";

let warnedAboutDevSecret = false;

/**
 * The signing key for every session cookie in the app — admin sessions here,
 * plus guest sessions (`user-auth.ts`) and OAuth state (`oauth-state.ts`).
 * One source of truth, one fail-closed rule.
 *
 * @throws {AdminConfigError} in production when SESSION_SECRET is unset.
 */
export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (secret && secret.length > 0) return secret;

  if (IS_PRODUCTION) {
    throw new AdminConfigError(
      "SESSION_SECRET is not set. Admin sessions cannot be signed. " +
        "Set it in the production environment (openssl rand -hex 32).",
    );
  }

  if (!warnedAboutDevSecret) {
    warnedAboutDevSecret = true;
    console.warn(
      "[admin-auth] SESSION_SECRET is unset — using the development-only " +
        "signing key. This will hard-fail in production.",
    );
  }
  return DEV_ONLY_SECRET;
}

/* ─────────────────────────── primitives ─────────────────────────── */

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(sig));
}

/**
 * Constant-time string comparison. Compares every character regardless of
 * where the first mismatch is, so response timing does not leak the signature
 * (or, at the login screen, the password).
 */
export function timingSafeEqual(a: string, b: string): boolean {
  // Length is not secret here (both sides are fixed-width hex/base64url), but
  // we still avoid an early return on the compare loop itself.
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ─────────────────────────── mint / verify ─────────────────────────── */

export type AdminSession = {
  /** Unique per login — the revocation key. */
  sid: string;
  issuedAt: number;
  expiresAt: number;
};

/** Mints a brand-new session. Called only after a successful password check. */
export async function createAdminSession(): Promise<{
  token: string;
  session: AdminSession;
}> {
  const raw = new Uint8Array(16);
  crypto.getRandomValues(raw);
  const sid = bytesToBase64Url(raw);

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ADMIN_SESSION_MAX_AGE_SECONDS;

  const payload = `v1.${sid}.${issuedAt}.${expiresAt}`;
  const token = `${payload}.${await hmac(payload)}`;

  return { token, session: { sid, issuedAt, expiresAt } };
}

/**
 * Verifies signature + expiry. Returns null for anything malformed, tampered,
 * or expired. Does NOT check the revocation list — that needs filesystem
 * access, so it lives in `requireAdmin()` on the Node side.
 */
export async function verifyAdminSession(
  token: string | undefined,
): Promise<AdminSession | null> {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length !== 5) return null;

  const [version, sid, iatRaw, expRaw, sig] = parts;
  if (version !== "v1" || !sid || !sig) return null;

  const issuedAt = Number(iatRaw);
  const expiresAt = Number(expRaw);
  if (!Number.isSafeInteger(issuedAt) || !Number.isSafeInteger(expiresAt)) {
    return null;
  }

  // Expiry first: a stale token is rejected even if the signature is perfect.
  if (Math.floor(Date.now() / 1000) >= expiresAt) return null;

  const expected = await hmac(`v1.${sid}.${issuedAt}.${expiresAt}`);
  if (!timingSafeEqual(sig, expected)) return null;

  return { sid, issuedAt, expiresAt };
}

/** Cookie attributes shared by every place that writes the admin cookie. */
export function adminCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
