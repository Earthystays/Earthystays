"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { GoogleButton } from "@/components/auth/google-button";
import { signup, type SignupState } from "./actions";

const INITIAL: SignupState = { ok: false };

export function SignupForm({
  nextPath,
  googleConfigured,
}: {
  nextPath?: string;
  googleConfigured: boolean;
}) {
  const [state, action, pending] = useActionState(signup, INITIAL);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="grid gap-5">
      <form action={action} className="grid gap-4">
        <input type="hidden" name="next" value={nextPath ?? "/"} />
        <div className="grid gap-1.5">
          <Label htmlFor="name" className="text-sm font-medium text-foreground">
            Your name*
          </Label>
          <Input
            id="name"
            name="name"
            required
            autoFocus
            autoComplete="name"
            defaultValue={state.values?.name ?? ""}
            placeholder="Aanya Sharma"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Email*
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            defaultValue={state.values?.email ?? ""}
            placeholder="you@example.com"
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
              minLength={8}
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

        {state.error && (
          <p className="text-xs text-destructive">{state.error}</p>
        )}

        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full rounded-md text-base font-medium"
        >
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : "/login"}
          className="font-medium text-terracotta hover:underline"
        >
          Sign in
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
