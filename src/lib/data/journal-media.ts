import type { JournalMedia } from "@/lib/journal/types";
import { readJson, writeJson } from "@/lib/storage";
import crypto from "crypto";

const FILE = "journal-media.json";

export async function readMedia(): Promise<JournalMedia[]> {
  return readJson<JournalMedia[]>(FILE, []);
}

export async function saveMedia(list: JournalMedia[]): Promise<void> {
  await writeJson(FILE, list);
}

/** Record an already-uploaded asset in the library (newest first). */
export async function addMedia(
  entry: Omit<JournalMedia, "id" | "uploadedAt">,
): Promise<JournalMedia> {
  const list = await readMedia();
  const media: JournalMedia = {
    ...entry,
    id: `m-${crypto.randomBytes(5).toString("hex")}`,
    uploadedAt: new Date().toISOString(),
  };
  list.unshift(media);
  await saveMedia(list);
  return media;
}

export async function updateMedia(
  id: string,
  patch: Partial<JournalMedia>,
): Promise<void> {
  const list = await readMedia();
  await saveMedia(list.map((m) => (m.id === id ? { ...m, ...patch } : m)));
}

export async function deleteMedia(id: string): Promise<void> {
  const list = await readMedia();
  await saveMedia(list.filter((m) => m.id !== id));
}
