import { cookies } from "next/headers";
import { verifySession } from "./user-auth";
import { findUserById, type User } from "./data/users";

export const USER_COOKIE = "es-user";

export async function getCurrentUser(): Promise<User | null> {
  const c = await cookies();
  const token = c.get(USER_COOKIE)?.value;
  if (!token) return null;
  const userId = verifySession(token);
  if (!userId) return null;
  const user = await findUserById(userId);
  return user ?? null;
}

export async function getWishlistSlugs(): Promise<Set<string>> {
  const user = await getCurrentUser();
  return new Set(user?.wishlist ?? []);
}
