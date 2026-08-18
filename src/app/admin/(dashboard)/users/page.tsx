import { Users as UsersIcon } from "lucide-react";
import { getUsers } from "@/lib/data/users";
import { UsersTable } from "./users-table";

export const metadata = { title: "Users · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const all = await getUsers();
  all.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const stats = {
    total: all.length,
    week: all.filter((u) => new Date(u.createdAt).getTime() >= weekAgo).length,
    month: all.filter((u) => new Date(u.createdAt).getTime() >= monthAgo).length,
    google: all.filter((u) => u.passwordHash === "google::oauth").length,
  };

  const rows = all.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    source:
      u.passwordHash === "google::oauth"
        ? ("google" as const)
        : ("email" as const),
    wishlistCount: u.wishlist?.length ?? 0,
    createdAt: u.createdAt,
    isHost: u.isHost ?? false,
  }));

  return (
    <div>
      <header>
        <h1 className="font-display text-4xl">Users</h1>
        <p className="mt-2 text-muted-foreground">
          Everyone who has signed up to save villas or get in touch.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total signups" value={stats.total} />
        <StatCard label="This week" value={stats.week} />
        <StatCard label="Last 30 days" value={stats.month} />
        <StatCard label="Via Google" value={stats.google} />
      </div>

      {all.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-6 py-20 text-center">
          <UsersIcon className="h-10 w-10 text-muted-foreground" strokeWidth={1.5} />
          <h2 className="mt-4 font-display text-2xl">No users yet</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            When someone signs up via Google or email on the public site, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <UsersTable users={rows} />
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-4 py-3">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-numeric text-3xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
