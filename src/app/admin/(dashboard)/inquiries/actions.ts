"use server";

import { revalidatePath } from "next/cache";
import { readJson, writeJson } from "@/lib/storage";
import type { InquiryStatus, StoredInquiry } from "@/app/api/inquiries/route";

const FILE = "inquiries.json";

export async function updateInquiryStatus(
  id: string,
  status: InquiryStatus,
): Promise<{ ok: boolean; error?: string }> {
  const list = await readJson<StoredInquiry[]>(FILE, []);
  const idx = list.findIndex((q) => q.id === id);
  if (idx < 0) return { ok: false, error: "Not found" };
  list[idx] = { ...list[idx], status, updatedAt: new Date().toISOString() };
  await writeJson(FILE, list);
  revalidatePath("/admin/inquiries");
  return { ok: true };
}

export async function saveInquiryNote(
  id: string,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  const list = await readJson<StoredInquiry[]>(FILE, []);
  const idx = list.findIndex((q) => q.id === id);
  if (idx < 0) return { ok: false, error: "Not found" };
  list[idx] = {
    ...list[idx],
    note: note.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeJson(FILE, list);
  revalidatePath("/admin/inquiries");
  return { ok: true };
}
