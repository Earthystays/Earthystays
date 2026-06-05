"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, adminToken, getAdminPassword } from "@/lib/admin-auth";

export type LoginState = { ok: boolean; error?: string };

export async function login(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const password = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";

  if (password !== getAdminPassword()) {
    return { ok: false, error: "Wrong password" };
  }

  const token = await adminToken();
  const c = await cookies();
  c.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  redirect(safeNext);
}
