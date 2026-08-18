"use server";

import { revalidatePath } from "next/cache";
import { deleteUser, makeHost, revokeHost } from "@/lib/data/users";

export async function deleteUserAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteUser(id);
  revalidatePath("/admin/users");
}

export async function grantHostAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await makeHost(id);
  revalidatePath("/admin/users");
}

export async function revokeHostAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await revokeHost(id);
  revalidatePath("/admin/users");
}
