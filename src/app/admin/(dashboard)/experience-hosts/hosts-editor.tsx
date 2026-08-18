"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Pencil, X, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImageUploadButton } from "@/components/image-upload-button";
import type { ExperienceHost } from "@/lib/types";
import { saveHost, deleteHost } from "./actions";

const EMPTY: ExperienceHost = { id: "", name: "", languages: [] };

export function HostsAdmin({ initial }: { initial: ExperienceHost[] }) {
  const [editing, setEditing] = useState<ExperienceHost | null>(null);
  const [adding, setAdding] = useState(false);

  if (adding || editing) {
    return (
      <HostForm
        key={editing?.id ?? "new"}
        initial={editing ?? undefined}
        onClose={() => {
          setAdding(false);
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {initial.length} {initial.length === 1 ? "host" : "hosts"}
        </p>
        <Button onClick={() => setAdding(true)} className="rounded-full">
          <Plus className="mr-1.5 h-4 w-4" /> New host
        </Button>
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {initial.map((h) => (
          <HostCard key={h.id} host={h} onEdit={() => setEditing(h)} />
        ))}
      </ul>
    </div>
  );
}

function HostCard({ host, onEdit }: { host: ExperienceHost; onEdit: () => void }) {
  const [pending, start] = useTransition();
  function del() {
    if (!confirm(`Delete host "${host.name}"?`)) return;
    start(async () => {
      const res = await deleteHost(host.id);
      if (res.ok) toast.success("Host deleted");
      else toast.error(res.error ?? "Failed");
    });
  }
  return (
    <li className={`rounded-xl border border-border/60 bg-card p-4 ${pending ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        {host.photo?.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={host.photo.src} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-full bg-muted text-sm font-semibold">
            {host.name.slice(0, 1)}
          </div>
        )}
        <div>
          <p className="inline-flex items-center gap-1 font-medium">
            {host.name}
            {host.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
          </p>
          <p className="text-xs text-muted-foreground">
            {(host.languages ?? []).join(", ") || "—"}
          </p>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-3 text-xs">
        <button type="button" onClick={onEdit} className="inline-flex items-center gap-1 text-terracotta hover:underline">
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button type="button" onClick={del} className="inline-flex items-center gap-1 text-destructive hover:underline">
          <Trash2 className="h-3 w-3" /> Delete
        </button>
      </div>
    </li>
  );
}

function HostForm({ initial, onClose }: { initial?: ExperienceHost; onClose: () => void }) {
  const [d, setD] = useState<ExperienceHost>(initial ?? EMPTY);
  const [pending, start] = useTransition();
  const set = (patch: Partial<ExperienceHost>) => setD((p) => ({ ...p, ...patch }));

  function submit() {
    if (d.name.trim().length < 2) return toast.error("Name is required.");
    start(async () => {
      const res = await saveHost(d);
      if (res.ok) {
        toast.success(initial ? "Host saved" : "Host created");
        onClose();
      } else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="mt-6 space-y-4 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl">{initial ? `Edit ${initial.name}` : "New host"}</h2>
        <button type="button" onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-1.5">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Photo</Label>
        <div className="flex items-center gap-3">
          {d.photo?.src && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={d.photo.src} alt="" className="h-16 w-16 rounded-full object-cover" />
          )}
          <ImageUploadButton
            label={d.photo?.src ? "Replace" : "Upload photo"}
            onUploaded={(url) => set({ photo: { src: url, alt: d.name } })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *"><Input value={d.name} onChange={(e) => set({ name: e.target.value })} /></Field>
        <Field label="Languages (comma-separated)">
          <Input value={(d.languages ?? []).join(", ")} onChange={(e) => set({ languages: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
        </Field>
        <Field label="Years experience"><Input type="number" value={d.yearsExperience ?? ""} onChange={(e) => set({ yearsExperience: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
        <Field label="Guests hosted"><Input type="number" value={d.guestsHosted ?? ""} onChange={(e) => set({ guestsHosted: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
        <Field label="Rating (0–5)"><Input type="number" step="0.1" value={d.rating ?? ""} onChange={(e) => set({ rating: e.target.value === "" ? undefined : Number(e.target.value) })} /></Field>
        <Field label="Instagram"><Input value={d.instagram ?? ""} onChange={(e) => set({ instagram: e.target.value })} /></Field>
        <Field label="WhatsApp"><Input value={d.whatsapp ?? ""} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
        <Field label="Email"><Input value={d.email ?? ""} onChange={(e) => set({ email: e.target.value })} /></Field>
      </div>

      <Field label="Bio"><Textarea rows={4} value={d.bio ?? ""} onChange={(e) => set({ bio: e.target.value })} /></Field>

      <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
        <input type="checkbox" checked={!!d.verified} onChange={(e) => set({ verified: e.target.checked })} className="accent-primary" />
        Verified host
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
        <Button type="button" onClick={submit} disabled={pending}>{pending ? "Saving…" : "Save host"}</Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
