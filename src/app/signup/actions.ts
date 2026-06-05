"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import { createUser, findUserByEmail } from "@/lib/data/users";
import { hashPassword, signSession } from "@/lib/user-auth";
import { USER_COOKIE } from "@/lib/session";

const Schema = z.object({
  name: z.string().min(2, "Please share your name"),
  email: z.string().email("Use a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export type SignupState = {
  ok: boolean;
  error?: string;
  values?: { name: string; email: string };
};

export async function signup(
  _prev: SignupState,
  form: FormData,
): Promise<SignupState> {
  const raw = {
    name: String(form.get("name") ?? "").trim(),
    email: String(form.get("email") ?? "").trim(),
    password: String(form.get("password") ?? ""),
  };
  const parsed = Schema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Please check the fields",
      values: { name: raw.name, email: raw.email },
    };
  }

  const existing = await findUserByEmail(parsed.data.email);
  if (existing) {
    return {
      ok: false,
      error: "An account already exists with that email. Try signing in.",
      values: { name: raw.name, email: raw.email },
    };
  }

  const user = await createUser({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: hashPassword(parsed.data.password),
  });

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
