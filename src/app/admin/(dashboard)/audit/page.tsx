import { getAuditLog, type AuditEntry } from "@/lib/admin-audit";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Audit log · Admin",
  robots: { index: false, follow: false },
};

/** Groups actions into colour bands so a scan picks out destructive ones. */
function toneFor(action: AuditEntry["action"]): string {
  if (action.endsWith(".deleted") || action === "admin.login_failed") {
    return "bg-red-50 text-red-800 ring-red-600/15";
  }
  if (action.endsWith(".published") || action === "user.host_granted") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-600/15";
  }
  if (action.startsWith("admin.")) {
    return "bg-slate-100 text-slate-700 ring-slate-500/15";
  }
  return "bg-amber-50 text-amber-900 ring-amber-600/15";
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AuditPage() {
  const entries = await getAuditLog(300);

  return (
    <div className="grid gap-6">
      <header className="grid gap-1">
        <h1 className="font-display text-2xl">Audit log</h1>
        <p className="text-sm text-muted-foreground">
          Every admin action that changes data, newest first. Records what
          changed and when — never passwords, tokens, or payment details.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-card/50 p-10 text-center">
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Admin actions will appear here as they happen.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <caption className="sr-only">
              Admin actions, most recent first
            </caption>
            <thead>
              <tr className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-3 font-medium">When</th>
                <th scope="col" className="px-4 py-3 font-medium">Action</th>
                <th scope="col" className="px-4 py-3 font-medium">Details</th>
                <th scope="col" className="px-4 py-3 font-medium">Record</th>
                <th scope="col" className="px-4 py-3 font-medium">Session</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-border/40 last:border-0 align-top"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatWhen(e.at)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${toneFor(e.action)}`}
                    >
                      {e.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground">{e.summary ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {e.entity ? (
                      <span className="font-mono text-xs">
                        {e.entity}
                        {e.entityId ? `/${e.entityId}` : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {e.sid ? e.sid.slice(0, 8) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
