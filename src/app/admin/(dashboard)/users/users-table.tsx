"use client";

import { useMemo, useState } from "react";
import { Search, Trash2, Heart, Home, X } from "lucide-react";
import { deleteUserAction, grantHostAction, revokeHostAction } from "./actions";

type Row = {
  id: string;
  name: string;
  email: string;
  source: "google" | "email";
  wishlistCount: number;
  createdAt: string;
  isHost: boolean;
};

const fmt = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function UsersTable({ users }: { users: Row[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    );
  }, [query, users]);

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20"
          />
        </div>
        <a
          href="/api/admin/users/export"
          className="rounded-md border border-border bg-background px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          Export CSV
        </a>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Signup</th>
              <th className="px-4 py-3 text-left font-medium">Saved</th>
              <th className="px-4 py-3 text-left font-medium">Joined</th>
              <th className="px-4 py-3 text-left font-medium">Host access</th>
              <th className="px-4 py-3 text-right font-medium" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-12 text-center text-sm text-muted-foreground"
                >
                  {query
                    ? "No users match your search."
                    : "No users have signed up yet."}
                </td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-border/60">
                  <td className="px-4 py-3 font-medium text-foreground">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.source === "google" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                        Google
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground">
                        Email
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Heart className="h-3.5 w-3.5" />
                      {u.wishlistCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {fmt.format(new Date(u.createdAt))}
                  </td>
                  <td className="px-4 py-3">
                    {u.isHost ? (
                      <form action={revokeHostAction} className="inline-flex items-center gap-2">
                        <input type="hidden" name="id" value={u.id} />
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                          <Home className="h-3 w-3" /> Host
                        </span>
                        <button
                          type="submit"
                          title={`Revoke host access for ${u.name}`}
                          onClick={(e) => {
                            if (
                              !window.confirm(
                                `Revoke host access for ${u.name} (${u.email})? Their listings stay, but they lose access to the host dashboard.`,
                              )
                            )
                              e.preventDefault();
                          }}
                          className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    ) : (
                      <form action={grantHostAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          onClick={(e) => {
                            if (
                              !window.confirm(
                                `Grant host access to ${u.name} (${u.email})? They'll be able to list villas and manage bookings.`,
                              )
                            )
                              e.preventDefault();
                          }}
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
                        >
                          <Home className="h-3 w-3" /> Grant host access
                        </button>
                      </form>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <form action={deleteUserAction}>
                      <input type="hidden" name="id" value={u.id} />
                      <button
                        type="submit"
                        aria-label={`Delete ${u.name}`}
                        onClick={(e) => {
                          if (
                            !window.confirm(
                              `Delete ${u.name} (${u.email})? This can't be undone.`,
                            )
                          )
                            e.preventDefault();
                        }}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="mt-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {users.length}
        </p>
      )}
    </div>
  );
}
