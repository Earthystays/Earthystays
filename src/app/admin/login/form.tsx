"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { login, type LoginState } from "./actions";

const INITIAL: LoginState = { ok: false };

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, action, pending] = useActionState(login, INITIAL);
  const [forgotOpen, setForgotOpen] = useState(false);

  return (
    <form action={action} className="mt-6 grid gap-4">
      <input type="hidden" name="next" value={nextPath ?? "/admin"} />
      <div className="grid gap-1.5">
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-wider text-muted-foreground"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          autoFocus
        />
      </div>
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Signing in…" : "Sign in"}
      </Button>

      {/* "Forgot password?" link — opens reset instructions in a modal */}
      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className="text-xs text-terracotta hover:underline"
            />
          }
        >
          Forgot password?
        </DialogTrigger>

        <DialogContent className="!max-w-md p-6">
          <DialogTitle className="font-display text-xl font-bold tracking-tight">
            Reset the admin password
          </DialogTitle>
          <DialogDescription className="!text-sm text-muted-foreground">
            The admin password lives on the server (not in a database) so it
            can&apos;t be reset via email. Here&apos;s how to change it:
          </DialogDescription>

          <ol className="mt-4 grid gap-3 text-sm">
            <li className="grid gap-1">
              <p className="font-medium text-foreground">
                1. SSH into your VPS
              </p>
              <code className="block rounded bg-muted px-2 py-1.5 text-xs">
                ssh root@your-server-ip
              </code>
            </li>
            <li className="grid gap-1">
              <p className="font-medium text-foreground">
                2. Edit the env file
              </p>
              <code className="block rounded bg-muted px-2 py-1.5 text-xs">
                nano /var/www/earthystays/.env.production
              </code>
              <p className="text-xs text-muted-foreground">
                Find the line <code>ADMIN_PASSWORD=…</code> and change it.
                Save with <kbd>Ctrl+O</kbd> → <kbd>Enter</kbd> →{" "}
                <kbd>Ctrl+X</kbd>.
              </p>
            </li>
            <li className="grid gap-1">
              <p className="font-medium text-foreground">
                3. Restart the app
              </p>
              <code className="block rounded bg-muted px-2 py-1.5 text-xs">
                pm2 restart earthystays --update-env
              </code>
            </li>
          </ol>

          <p className="mt-4 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            The new password takes effect immediately. Use it to sign in on this
            same screen.
          </p>
        </DialogContent>
      </Dialog>
    </form>
  );
}
