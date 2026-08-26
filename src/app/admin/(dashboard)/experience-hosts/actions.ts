"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { revalidatePath } from "next/cache";
import type { ExperienceHost } from "@/lib/types";
import { readHosts, saveHosts, newHostId } from "@/lib/data/experience-hosts";

type Result = { ok: boolean; error?: string; id?: string };

function revalidate() {
  revalidatePath("/admin/experience-hosts");
  revalidatePath("/admin/experiences");
  revalidatePath("/experiences");
}

export async function saveHost(input: ExperienceHost): Promise<Result> {
  await requireAdmin();
  const name = (input.name ?? "").trim();
  if (name.length < 2) return { ok: false, error: "Host name is required." };

  const list = await readHosts();
  if (input.id) {
    const idx = list.findIndex((h) => h.id === input.id);
    if (idx === -1) return { ok: false, error: "Host not found." };
    list[idx] = { ...list[idx], ...input };
    await saveHosts(list);
    revalidate();
    return { ok: true, id: input.id };
  }
  const id = newHostId();
  list.push({ ...input, id });
  await saveHosts(list);
  revalidate();
  return { ok: true, id };
}

export async function deleteHost(id: string): Promise<Result> {
  await requireAdmin();
  const list = await readHosts();
  await saveHosts(list.filter((h) => h.id !== id));
  revalidate();
  return { ok: true };
}
