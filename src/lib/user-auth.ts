/**
 * Guest authentication — password hashing and session tokens for site users.
 *
 * Shares its signing key with admin sessions and OAuth state via
 * `sessionSecret()`, which fails closed in production rather than falling back
 * to a checked-in default.
 */
import {
  scryptSync,
  randomBytes,
  createHmac,
  timingSafeEqual as nodeTimingSafeEqual,
} from "crypto";
import { AdminConfigError, sessionSecret } from "./admin-session";

/** salt:hash format using Node's built-in scrypt. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = scryptSync(password, salt, 64).toString("hex");
  // constant-time compare on equal-length hex strings
  if (test.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < test.length; i++) diff |= test.charCodeAt(i) ^ hash.charCodeAt(i);
  return diff === 0;
}

/** How long a guest stays signed in. Matches the cookie's own maxAge. */
export const GUEST_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

function sign(payload: string): string {
  return createHmac("sha256", sessionSecret()).update(payload).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return nodeTimingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Session token: `v2.<userId>.<iat>.<exp>.<sig>` (epoch seconds).
 *
 * The expiry sits inside the signed payload, so it cannot be extended by
 * editing the cookie.
 */
export function signSession(userId: string): string {
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + GUEST_SESSION_MAX_AGE_SECONDS;
  const payload = `v2.${userId}.${iat}.${exp}`;
  return `${payload}.${sign(payload)}`;
}

/**
 * Verifies a session token and returns the user id, or null.
 *
 * Also accepts the legacy `<userId>.<timestampMs>.<sig>` format, so guests who
 * are already signed in are not logged out by the upgrade. Legacy tokens carry
 * their issue time, so the same 90-day expiry is enforced on them — previously
 * they never expired at all.
 */
export function verifySession(token: string): string | null {
  try {
    sessionSecret();
  } catch (err) {
    // Misconfigured server — fail closed rather than trusting any token.
    if (err instanceof AdminConfigError) return null;
    throw err;
  }

  const parts = token.split(".");
  const nowSeconds = Math.floor(Date.now() / 1000);

  if (parts.length === 5 && parts[0] === "v2") {
    const [, userId, iatRaw, expRaw, sig] = parts;
    const iat = Number(iatRaw);
    const exp = Number(expRaw);
    if (!userId || !Number.isSafeInteger(iat) || !Number.isSafeInteger(exp)) {
      return null;
    }
    if (nowSeconds >= exp) return null;
    if (!safeEqualHex(sig, sign(`v2.${userId}.${iat}.${exp}`))) return null;
    return userId;
  }

  // Legacy format — verify, then apply the expiry it never had.
  if (parts.length === 3) {
    const [userId, tsRaw, sig] = parts;
    const issuedMs = Number(tsRaw);
    if (!userId || !Number.isSafeInteger(issuedMs)) return null;
    if (!safeEqualHex(sig, sign(`${userId}.${tsRaw}`))) return null;
    if (nowSeconds >= Math.floor(issuedMs / 1000) + GUEST_SESSION_MAX_AGE_SECONDS) {
      return null;
    }
    return userId;
  }

  return null;
}
