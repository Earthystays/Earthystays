"use client";

import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { login, type LoginState } from "./actions";

const INITIAL: LoginState = { ok: false };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(login, INITIAL);
  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />
      <div className="grid gap-1.5">
        <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
          Password
        </Label>
        <Input id="password" name="password" type="password" required autoFocus />
      </div>
      {state.error && <p className="text-xs text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <p className="text-xs text-muted-foreground">
        Default password is <code className="rounded bg-muted px-1 py-0.5">earthystays</code> until you set{" "}
        <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code> in <code className="rounded bg-muted px-1 py-0.5">.env.local</code>.
      </p>
    </form>
  );
}
