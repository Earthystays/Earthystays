"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import { readSubscribers, saveSubscribers } from "@/lib/data/journal-newsletter";

export async function setSubscriberStatus(
  email: string,
  status: "subscribed" | "unsubscribed",
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readSubscribers();
  const sub = list.find((s) => s.email === email);
  if (!sub) return { ok: false };
  sub.status = status;
  if (status === "unsubscribed") sub.unsubscribedAt = new Date().toISOString();
  else sub.unsubscribedAt = undefined;
  await saveSubscribers(list);
  revalidatePath("/admin/journal/newsletter");
  return { ok: true };
}

export async function removeSubscriber(email: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readSubscribers();
  await saveSubscribers(list.filter((s) => s.email !== email));
  revalidatePath("/admin/journal/newsletter");
  return { ok: true };
}
