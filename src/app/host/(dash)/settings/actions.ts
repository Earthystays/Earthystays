"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/session";
import { getUsers } from "@/lib/data/users";
import { writeJson } from "@/lib/storage";

export async function updateHostProfile(form: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user?.isHost) redirect("/login?next=/host/settings");

  const name = String(form.get("name") ?? "").trim();
  const hostPhone = String(form.get("hostPhone") ?? "").trim();
  if (name.length < 2) redirect("/host/settings?error=name");

  const users = await getUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx < 0) redirect("/host/settings?error=user");
  users[idx].name = name;
  users[idx].hostPhone = hostPhone || undefined;
  await writeJson("users.json", users);

  revalidatePath("/host", "layout");
  redirect("/host/settings?saved=1");
}
