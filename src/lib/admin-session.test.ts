import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createAdminSession,
  timingSafeEqual,
  verifyAdminSession,
  ADMIN_SESSION_MAX_AGE_SECONDS,
} from "./admin-session";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  clientKeyFromHeaders,
  recordLoginFailure,
} from "./admin-rate-limit";

describe("admin session tokens", () => {
  it("round-trips a freshly minted token", async () => {
    const { token, session } = await createAdminSession();
    const verified = await verifyAdminSession(token);
    expect(verified).not.toBeNull();
    expect(verified!.sid).toBe(session.sid);
  });

  it("issues a distinct session id per login (session fixation)", async () => {
    const a = await createAdminSession();
    const b = await createAdminSession();
    expect(a.session.sid).not.toBe(b.session.sid);
    expect(a.token).not.toBe(b.token);
  });

  it("sets the expiry to the configured max age", async () => {
    const { session } = await createAdminSession();
    expect(session.expiresAt - session.issuedAt).toBe(
      ADMIN_SESSION_MAX_AGE_SECONDS,
    );
  });

  it.each([
    ["undefined", undefined],
    ["empty", ""],
    ["not a token", "hello"],
    ["wrong segment count", "v1.abc.1.2"],
    ["wrong version", "v2.abc.1.99999999999.sig"],
  ])("rejects a malformed token (%s)", async (_label, token) => {
    expect(await verifyAdminSession(token as string | undefined)).toBeNull();
  });

  it("rejects a tampered signature", async () => {
    const { token } = await createAdminSession();
    const parts = token.split(".");
    parts[4] = parts[4].split("").reverse().join("");
    expect(await verifyAdminSession(parts.join("."))).toBeNull();
  });

  it("rejects a token whose session id was swapped", async () => {
    const { token } = await createAdminSession();
    const other = await createAdminSession();
    const parts = token.split(".");
    parts[1] = other.session.sid;
    expect(await verifyAdminSession(parts.join("."))).toBeNull();
  });

  it("rejects an extended expiry (signature covers exp)", async () => {
    const { token } = await createAdminSession();
    const parts = token.split(".");
    parts[3] = String(Number(parts[3]) + 60 * 60 * 24 * 365);
    expect(await verifyAdminSession(parts.join("."))).toBeNull();
  });

  it("rejects a token that has expired", async () => {
    const { token } = await createAdminSession();
    // Jump past the expiry rather than waiting it out.
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (ADMIN_SESSION_MAX_AGE_SECONDS + 60) * 1000);
    expect(await verifyAdminSession(token)).toBeNull();
    vi.useRealTimers();
  });
});

describe("timingSafeEqual", () => {
  it("matches identical strings and rejects everything else", () => {
    expect(timingSafeEqual("abc", "abc")).toBe(true);
    expect(timingSafeEqual("abc", "abd")).toBe(false);
    expect(timingSafeEqual("abc", "ab")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("login rate limiting", () => {
  beforeEach(() => clearLoginAttempts("1.2.3.4"));

  it("allows attempts until the cap, then locks out", () => {
    expect(checkLoginRateLimit("1.2.3.4").allowed).toBe(true);

    let last = recordLoginFailure("1.2.3.4");
    for (let i = 0; i < 3; i++) last = recordLoginFailure("1.2.3.4");
    expect(last.allowed).toBe(true); // 4 failures — still under the cap

    last = recordLoginFailure("1.2.3.4"); // 5th
    expect(last.allowed).toBe(false);
    expect(checkLoginRateLimit("1.2.3.4").allowed).toBe(false);
  });

  it("tracks clients independently", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4");
    expect(checkLoginRateLimit("1.2.3.4").allowed).toBe(false);
    expect(checkLoginRateLimit("5.6.7.8").allowed).toBe(true);
  });

  it("clears history after a successful login", () => {
    for (let i = 0; i < 5; i++) recordLoginFailure("1.2.3.4");
    clearLoginAttempts("1.2.3.4");
    expect(checkLoginRateLimit("1.2.3.4").allowed).toBe(true);
  });

  it("reads the client address from proxy headers", () => {
    expect(
      clientKeyFromHeaders(new Headers({ "x-forwarded-for": "9.9.9.9, 10.0.0.1" })),
    ).toBe("9.9.9.9");
    expect(clientKeyFromHeaders(new Headers({ "x-real-ip": "8.8.8.8" }))).toBe(
      "8.8.8.8",
    );
    expect(clientKeyFromHeaders(new Headers())).toBe("unknown");
  });
});
