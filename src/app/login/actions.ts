"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { findUserByEmail } from "@/lib/data/users";
import { verifyPassword, signSession } from "@/lib/user-auth";
import { USER_COOKIE } from "@/lib/session";

const Schema = z.object({
  email: z.string().email("Use a valid email"),
  password: z.string().min(1, "Password required"),
});

export type LoginState = {
  ok: boolean;
  error?: string;
  values?: { email: string };
};

export async function login(
  _prev: LoginState,
  form: FormData,
): Promise<LoginState> {
  const raw = {
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the fields",
      values: { email: raw.email },
    };
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return {
      ok: false,
      error: "Email or password is wrong.",
      values: { email: raw.email },
    };
  }

  const c = await cookies();
  c.set(USER_COOKIE, signSession(user.id), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 90, // 90 days
    secure: process.env.NODE_ENV === "production",
  });

  const next = String(form.get("next") ?? "/").trim();
  redirect(next.startsWith("/") ? next : "/");
}
