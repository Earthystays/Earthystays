import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "./form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; googleError?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  if (user) redirect(sp.next ?? "/");

  return (
    <AuthShell
      title="Welcome to Earthy Stays"
      subtitle="Sign in to save villas and skip retyping on your next inquiry."
    >
      <LoginForm
        nextPath={sp.next}
        googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID)}
        googleError={sp.googleError}
      />
    </AuthShell>
  );
}
