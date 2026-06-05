import { scryptSync, randomBytes, createHmac } from "crypto";

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

const SESSION_SECRET = process.env.SESSION_SECRET || "earthystays-dev-secret-rotate-me";

/** Session token format: <userId>.<timestamp>.<sig>  (sig = HMAC-SHA256). */
export function signSession(userId: string): string {
  const payload = `${userId}.${Date.now()}`;
  const sig = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySession(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, ts, sig] = parts;
  const expected = createHmac("sha256", SESSION_SECRET).update(`${userId}.${ts}`).digest("hex");
  if (sig !== expected) return null;
  return userId;
}
