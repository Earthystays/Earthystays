"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { login, type LoginState } from "./actions";

const INITIAL: LoginState = { ok: false };

const ERROR_MESSAGES: Record<string, string> = {
  "not-configured": "Google sign-in is not configured yet. Use email and password instead.",
  "bad-state": "That Google session expired. Please try again.",
  "invalid-callback": "Google sign-in failed. Please try again.",
  "token-exchange": "Could not verify your Google account. Try again.",
  "profile-fetch": "Could not read your Google profile.",
  "no-email": "Your Google account has no email attached.",
  access_denied: "You cancelled Google sign-in.",
};

export function LoginForm({
  nextPath,
  googleConfigured,
  googleError,
}: {
  nextPath?: string;
  googleConfigured: boolean;
  googleError?: string;
}) {
  const [state, action, pending] = useActionState(login, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  const googleErrorMessage = googleError && (ERROR_MESSAGES[googleError] ?? googleError);

  return (
    <div className="grid gap-5">
      {googleErrorMessage && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {googleErrorMessage}
        </p>
      )}

      <form action={action} className="grid gap-4">
        <input type="hidden" name="next" value={nextPath ?? "/"} />
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email*
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            placeholder="Enter your email"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="password" className="text-sm font-medium text-foreground">
            Password*
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 inline-flex items-center gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Hide
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5" /> Show
                </>
              )}
            </button>
          </div>
        </div>

        <div className="-mt-1 flex justify-end">
          <Link
            href="/partner"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Forgot Password?
          </Link>
        </div>

        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-md text-base font-medium"
        >
          {pending ? "Signing in…" : "Log In"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link
          href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
          className="font-medium text-terracotta hover:underline"
        >
          Create an account
        </Link>
      </p>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton next={nextPath} configured={googleConfigured} />

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        By continuing you agree to our{" "}
        <Link href="/terms" className="underline hover:text-foreground">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
