"use client";

import Link from "next/link";
import { User as UserIcon, Heart, LogOut, UserPlus, LogIn } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  user,
  variant = "default",
}: {
  user: { name: string; email: string } | null;
  variant?: "default" | "overlay";
}) {
  const triggerOverlay =
    variant === "overlay"
      ? "border-white/40 bg-white/10 text-white hover:bg-white/20 backdrop-blur"
      : "border-border bg-background text-foreground hover:bg-muted";

  if (!user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-colors ${triggerOverlay}`}
          aria-label="Sign in"
        >
          <UserIcon className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56 p-2">
          <DropdownMenuItem onClick={() => (window.location.href = "/login")} className="gap-3 px-3 py-2.5 text-sm">
            <LogIn className="h-4 w-4 text-foreground" />
            Sign in
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => (window.location.href = "/signup")} className="gap-3 px-3 py-2.5 text-sm">
            <UserPlus className="h-4 w-4 text-foreground" />
            Create account
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  const initials = user.name
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium transition-colors hover:bg-primary/90"
        aria-label="Your account"
      >
        {initials || <UserIcon className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-2">
        <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/60 mb-1">
          Signed in as
          <p className="mt-0.5 text-sm font-medium text-foreground truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <DropdownMenuItem onClick={() => (window.location.href = "/wishlist")} className="gap-3 px-3 py-2.5 text-sm">
          <Heart className="h-4 w-4 text-foreground" />
          My wishlist
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            const f = document.createElement("form");
            f.method = "post";
            f.action = "/api/auth/logout";
            document.body.appendChild(f);
            f.submit();
          }}
          className="gap-3 px-3 py-2.5 text-sm"
        >
          <LogOut className="h-4 w-4 text-foreground" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Server-rendered link variant for when a server component knows the user. */
export function UserPill({ user }: { user: { name: string } }) {
  return (
    <Link
      href="/wishlist"
      className="text-sm text-muted-foreground hover:text-foreground"
    >
      Hi, {user.name.split(" ")[0]}
    </Link>
  );
}
