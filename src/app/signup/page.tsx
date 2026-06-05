import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SignupForm } from "./form";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = { title: "Create an account" };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const sp = await searchParams;
  if (user) redirect(sp.next ?? "/");

  return (
    <AuthShell
      title="Welcome to Earthy Stays"
      subtitle="Create an account to save villas to your wishlist and prefill your next inquiry."
    >
      <SignupForm
        nextPath={sp.next}
        googleConfigured={Boolean(process.env.GOOGLE_CLIENT_ID)}
      />
    </AuthShell>
  );
}
