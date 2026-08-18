import { requireHost } from "@/lib/host-auth";
import { updateHostProfile } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Settings · Hosting" };

export default async function HostSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const user = await requireHost();
  const sp = await searchParams;

  return (
    <div className="mx-auto max-w-[640px] px-5 py-8 lg:px-8">
      <h1 className="font-display text-3xl sm:text-4xl">Settings</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Your host profile — the concierge team uses these details to reach you.
      </p>

      {sp.saved && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-sm text-emerald-800">
          Saved.
        </div>
      )}
      {sp.error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700">
          {sp.error === "name" ? "Please enter your name." : "Something went wrong — try again."}
        </div>
      )}

      <form action={updateHostProfile} className="mt-8 space-y-5 rounded-2xl border border-border/60 bg-background p-6">
        <div>
          <label htmlFor="name" className="text-sm font-medium">Name</label>
          <input
            id="name"
            name="name"
            defaultValue={user.name}
            required
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
        </div>
        <div>
          <label htmlFor="hostPhone" className="text-sm font-medium">Phone (for the Earthy Stays team)</label>
          <input
            id="hostPhone"
            name="hostPhone"
            type="tel"
            defaultValue={user.hostPhone ?? ""}
            placeholder="+91 …"
            className="mt-1.5 w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">Never shown publicly.</p>
        </div>
        <div>
          <label className="text-sm font-medium" htmlFor="email">Email</label>
          <input
            id="email"
            value={user.email}
            readOnly
            className="mt-1.5 w-full cursor-not-allowed rounded-lg border border-border bg-muted/40 px-3.5 py-2.5 text-[15px] text-muted-foreground outline-none"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            To change your sign-in email, contact the concierge team.
          </p>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}
