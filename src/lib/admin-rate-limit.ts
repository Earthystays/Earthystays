/**
 * Brute-force protection for the admin login.
 *
 * In-memory and per-process, which matches how the app is deployed today
 * (a single pm2 process). If this ever runs multi-process, move the map to a
 * shared store — the interface here is deliberately small enough to swap.
 */

const MAX_ATTEMPTS = 5;
/** How long a client stays locked out once it burns through its attempts. */
const LOCKOUT_MS = 15 * 60 * 1000;
/** Failures older than this stop counting against a client. */
const WINDOW_MS = 15 * 60 * 1000;

type Bucket = { failures: number[]; lockedUntil: number };

const buckets = new Map<string, Bucket>();

/** Drops buckets nothing has touched for a while, so the map can't grow forever. */
function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    const live = bucket.failures.some((t) => now - t < WINDOW_MS);
    if (!live && bucket.lockedUntil < now) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { allowed: true; remaining: number }
  | { allowed: false; retryAfterSeconds: number };

/**
 * Checks whether `key` may attempt a login right now. Does not record an
 * attempt — call `recordFailure()` after a failed password check.
 */
export function checkLoginRateLimit(key: string): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket) return { allowed: true, remaining: MAX_ATTEMPTS };

  if (bucket.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((bucket.lockedUntil - now) / 1000),
    };
  }

  const recent = bucket.failures.filter((t) => now - t < WINDOW_MS);
  bucket.failures = recent;
  return { allowed: true, remaining: Math.max(0, MAX_ATTEMPTS - recent.length) };
}

/** Records a failed attempt, locking the client out once it hits the cap. */
export function recordLoginFailure(key: string): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { failures: [], lockedUntil: 0 };

  bucket.failures = bucket.failures.filter((t) => now - t < WINDOW_MS);
  bucket.failures.push(now);

  if (bucket.failures.length >= MAX_ATTEMPTS) {
    bucket.lockedUntil = now + LOCKOUT_MS;
    bucket.failures = [];
    buckets.set(key, bucket);
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000),
    };
  }

  buckets.set(key, bucket);
  return { allowed: true, remaining: MAX_ATTEMPTS - bucket.failures.length };
}

/** Clears a client's history after a successful login. */
export function clearLoginAttempts(key: string): void {
  buckets.delete(key);
}

/**
 * Best-effort client identity for rate limiting. Behind nginx the real address
 * arrives in `x-forwarded-for`; the left-most entry is the client.
 */
export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}
