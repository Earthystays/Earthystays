/**
 * Shared admin auth helpers — used by both middleware (Edge runtime) and
 * server actions (Node runtime). Uses Web Crypto so it works in both.
 */

export const ADMIN_COOKIE = "es-admin";

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "earthystays";
}

export async function adminToken(): Promise<string> {
  const password = getAdminPassword();
  const data = new TextEncoder().encode(`es-admin::${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
