import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import type { User } from "@/lib/data/users";

/** Gate for /host pages: must be signed in AND a host.
 *  Non-hosts land on the start-hosting page; visitors go to login. */
export async function requireHost(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/host");
  if (!user.isHost) redirect("/host/start");
  return user;
}

/** Gate for the start-hosting page: signed in, host or not. */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/host/start");
  return user;
}
