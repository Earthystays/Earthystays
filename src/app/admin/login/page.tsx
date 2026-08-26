import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { isAdminConfigured } from "@/lib/admin-auth";
import { LoginForm } from "./form";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

// Configuration is read at request time, so a fixed env fix takes effect
// without a rebuild.
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const sp = await searchParams;
  const configured = isAdminConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
        <Link href="/" className="text-xs text-muted-foreground hover:text-foreground">
          ← Back to site
        </Link>
        <h1 className="mt-4 font-display text-3xl">Sign in</h1>

        {configured ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Enter the admin password to manage Earthy Stays.
            </p>
            <LoginForm nextPath={sp.next} />
          </>
        ) : (
          /* Fail safe: no form at all when the server is misconfigured, so
             there is nothing to submit against a missing password. The message
             names the variables but never a value. */
          <div className="mt-4 grid gap-3">
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                aria-hidden="true"
              />
              <div className="grid gap-1">
                <p className="text-sm font-medium text-foreground">
                  Admin sign-in is not configured
                </p>
                <p className="text-xs text-muted-foreground">
                  The server is missing required security configuration, so the
                  admin area is locked.
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Set <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code>{" "}
              and <code className="rounded bg-muted px-1 py-0.5">SESSION_SECRET</code>{" "}
              in the server environment, then restart the app.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
