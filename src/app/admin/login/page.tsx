import Link from "next/link";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <h1 className="mt-4 font-display text-3xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the admin password to manage Earthy Stays.
        </p>
        <LoginForm nextPath={sp.next} />
      </div>
    </div>
  );
}
