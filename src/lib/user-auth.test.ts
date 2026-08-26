import { createHmac } from "crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GUEST_SESSION_MAX_AGE_SECONDS,
  hashPassword,
  signSession,
  verifyPassword,
  verifySession,
} from "./user-auth";

/** Rebuilds a legacy `<userId>.<timestampMs>.<sig>` token the old code issued. */
function legacyToken(userId: string, issuedMs: number): string {
  const payload = `${userId}.${issuedMs}`;
  const secret = process.env.SESSION_SECRET || "development-only-unsafe-signing-key";
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

afterEach(() => vi.useRealTimers());

describe("password hashing", () => {
  it("round-trips a password and rejects a wrong one", () => {
    const stored = hashPassword("correct horse battery staple");
    expect(verifyPassword("correct horse battery staple", stored)).toBe(true);
    expect(verifyPassword("wrong", stored)).toBe(false);
  });

  it("salts, so the same password hashes differently each time", () => {
    expect(hashPassword("same")).not.toBe(hashPassword("same"));
  });
});

describe("guest session tokens", () => {
  it("round-trips a v2 token", () => {
    expect(verifySession(signSession("usr_abc"))).toBe("usr_abc");
  });

  it("rejects a tampered signature", () => {
    const parts = signSession("usr_abc").split(".");
    parts[4] = parts[4].replace(/.$/, (c) => (c === "a" ? "b" : "a"));
    expect(verifySession(parts.join("."))).toBeNull();
  });

  it("rejects a swapped user id", () => {
    const parts = signSession("usr_abc").split(".");
    parts[1] = "usr_attacker";
    expect(verifySession(parts.join("."))).toBeNull();
  });

  it("rejects an extended expiry (signature covers exp)", () => {
    const parts = signSession("usr_abc").split(".");
    parts[3] = String(Number(parts[3]) + 60 * 60 * 24 * 3650);
    expect(verifySession(parts.join("."))).toBeNull();
  });

  it("expires after the max age", () => {
    const token = signSession("usr_abc");
    vi.useFakeTimers();
    vi.setSystemTime(Date.now() + (GUEST_SESSION_MAX_AGE_SECONDS + 60) * 1000);
    expect(verifySession(token)).toBeNull();
  });

  it.each([
    ["garbage", "nonsense"],
    ["empty", ""],
    ["too few segments", "usr_abc.123"],
    ["wrong version", "v9.usr_abc.1.2.deadbeef"],
  ])("rejects a malformed token (%s)", (_label, token) => {
    expect(verifySession(token)).toBeNull();
  });
});

describe("legacy guest sessions", () => {
  it("still accepts a recently issued legacy token (no forced logout)", () => {
    expect(verifySession(legacyToken("usr_legacy", Date.now()))).toBe("usr_legacy");
  });

  it("now expires an old legacy token that previously lived forever", () => {
    const ancient = Date.now() - (GUEST_SESSION_MAX_AGE_SECONDS + 86400) * 1000;
    expect(verifySession(legacyToken("usr_legacy", ancient))).toBeNull();
  });

  it("rejects a forged legacy token", () => {
    expect(verifySession("usr_legacy.1700000000000.deadbeef")).toBeNull();
  });
});
