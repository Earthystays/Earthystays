"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { revalidatePath } from "next/cache";
import { deleteUser, makeHost, revokeHost } from "@/lib/data/users";

export async function deleteUserAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await deleteUser(id);
  await logAdminAction({
    action: "user.deleted",
    entity: "user",
    entityId: id,
    summary: "User deleted",
  });
  revalidatePath("/admin/users");
}

export async function grantHostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await makeHost(id);
  await logAdminAction({
    action: "user.host_granted",
    entity: "user",
    entityId: id,
    summary: "Host access granted",
  });
  revalidatePath("/admin/users");
}

export async function revokeHostAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await revokeHost(id);
  await logAdminAction({
    action: "user.host_revoked",
    entity: "user",
    entityId: id,
    summary: "Host access revoked",
  });
  revalidatePath("/admin/users");
}
