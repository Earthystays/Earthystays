"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Download, Trash2 } from "lucide-react";
import type { JournalSubscriber } from "@/lib/journal/types";
import { setSubscriberStatus, removeSubscriber } from "./actions";

export function SubscribersTable({ subscribers }: { subscribers: JournalSubscriber[] }) {
  const [pending, start] = useTransition();

  function exportCsv() {
    const header = ["email", "status", "source", "subscribedAt", "unsubscribedAt"];
    const rows = subscribers.map((s) =>
      [s.email, s.status, s.source ?? "", s.subscribedAt, s.unsubscribedAt ?? ""]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `journal-subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" onClick={exportCsv} disabled={!subscribers.length} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm hover:bg-muted disabled:opacity-50">
          <Download className="h-4 w-4" /> Export CSV
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Subscribed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {subscribers.map((s) => (
              <tr key={s.email} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-3 font-medium">{s.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.status === "subscribed" ? "bg-forest/10 text-forest" : "bg-muted text-muted-foreground"}`}>
                    {s.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{s.source ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(s.subscribedAt).toLocaleDateString("en-IN")}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => start(async () => { await setSubscriberStatus(s.email, s.status === "subscribed" ? "unsubscribed" : "subscribed"); })}
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted"
                    >
                      {s.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => { if (confirm("Remove this subscriber?")) start(async () => { await removeSubscriber(s.email); }); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {subscribers.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-16 text-center text-muted-foreground">No subscribers yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
