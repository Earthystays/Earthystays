import { createHmac, timingSafeEqual } from "crypto";
import { sessionSecret } from "./admin-session";

/** Sign a small string (e.g. the `next` redirect path) so we can safely
 *  round-trip it through Google's `state` query parameter. */
export function signState(next: string): string {
  const payload = `${next}.${Date.now()}`;
  const sig = createHmac("sha256", sessionSecret()).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export function verifyState(token: string): string | null {
  try {
    const secret = sessionSecret();
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [next, ts, sig] = parts;
    const expected = createHmac("sha256", secret)
      .update(`${next}.${ts}`)
      .digest("hex");
    if (sig.length !== expected.length) return null;
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) {
      return null;
    }
    // Reject older than 30 min
    if (Date.now() - Number(ts) > 30 * 60 * 1000) return null;
    return next;
  } catch {
    // Includes a missing SESSION_SECRET in production — fail closed.
    return null;
  }
}
