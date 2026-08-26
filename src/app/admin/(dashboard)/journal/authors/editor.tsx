"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Plus, Save } from "lucide-react";
import type { JournalAuthor } from "@/lib/journal/types";
import { ImageUploadButton } from "@/components/image-upload-button";
import { saveAuthorList } from "../taxonomy-actions";

const field = "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-forest";

export function AuthorsEditor({ initial }: { initial: JournalAuthor[] }) {
  const [list, setList] = useState<JournalAuthor[]>(initial);
  const [newName, setNewName] = useState("");
  const [pending, start] = useTransition();

  const patch = (id: string, p: Partial<JournalAuthor>) =>
    setList((l) => l.map((a) => (a.id === id ? { ...a, ...p } : a)));

  function save() {
    start(async () => {
      const res = await saveAuthorList(list);
      if (res.ok) toast.success("Authors saved");
      else toast.error("Could not save");
    });
  }

  function add() {
    if (newName.trim().length < 2) return;
    setList([...list, { id: `new-${Date.now()}`, slug: "", name: newName.trim() }]);
    setNewName("");
  }

  return (
    <div className="space-y-4">
      {list.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start gap-4">
            {a.avatar?.src ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.avatar.src} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover" />
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-forest/15 font-serif text-xl text-forest">
                {a.name.charAt(0) || "?"}
              </div>
            )}
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <input value={a.name} onChange={(e) => patch(a.id, { name: e.target.value })} className={field} placeholder="Name" />
                <input value={a.role ?? ""} onChange={(e) => patch(a.id, { role: e.target.value })} className={`${field} max-w-[200px]`} placeholder="Role" />
                <button type="button" onClick={() => setList(list.filter((x) => x.id !== a.id))} className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
              </div>
              <textarea rows={2} value={a.bio ?? ""} onChange={(e) => patch(a.id, { bio: e.target.value })} className={field} placeholder="Short bio" />
              <div className="flex items-center gap-2">
                <ImageUploadButton onUploaded={(url, name) => patch(a.id, { avatar: { src: url, alt: name } })} label={a.avatar?.src ? "Replace photo" : "Add photo"} />
                <input value={a.socials?.instagram ?? ""} onChange={(e) => patch(a.id, { socials: { ...a.socials, instagram: e.target.value } })} className={field} placeholder="Instagram URL" />
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2 rounded-xl border border-dashed border-border p-3">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} className={field} placeholder="New author name" />
        <button type="button" onClick={add} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add</button>
      </div>

      <div className="sticky bottom-4 flex justify-end">
        <button type="button" onClick={save} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-2.5 text-sm font-medium text-white shadow-lg hover:bg-forest-deep disabled:opacity-50">
          <Save className="h-4 w-4" /> {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
