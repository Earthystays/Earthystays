import type { JournalSubscriber } from "@/lib/journal/types";
import { readJson, writeJson } from "@/lib/storage";
import crypto from "crypto";

const FILE = "journal-subscribers.json";

export async function readSubscribers(): Promise<JournalSubscriber[]> {
  return readJson<JournalSubscriber[]>(FILE, []);
}

export async function saveSubscribers(list: JournalSubscriber[]): Promise<void> {
  await writeJson(FILE, list);
}

/** Idempotent subscribe: re-subscribes a previously unsubscribed email,
 *  never stores a duplicate. Returns the (possibly reactivated) record. */
export async function subscribe(
  email: string,
  source = "journal",
): Promise<{ ok: boolean; error?: string }> {
  const normalized = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    return { ok: false, error: "Enter a valid email address." };
  }
  const list = await readSubscribers();
  const existing = list.find((s) => s.email === normalized);
  if (existing) {
    existing.status = "subscribed";
    existing.unsubscribedAt = undefined;
    if (!existing.token) existing.token = crypto.randomBytes(16).toString("hex");
  } else {
    list.unshift({
      email: normalized,
      status: "subscribed",
      source,
      subscribedAt: new Date().toISOString(),
      token: crypto.randomBytes(16).toString("hex"),
    });
  }
  await saveSubscribers(list);
  return { ok: true };
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const list = await readSubscribers();
  const sub = list.find((s) => s.token === token);
  if (!sub) return false;
  sub.status = "unsubscribed";
  sub.unsubscribedAt = new Date().toISOString();
  await saveSubscribers(list);
  return true;
}
