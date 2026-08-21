import type { JournalArticle, JournalRevision } from "@/lib/journal/types";
import { readJson, writeJson } from "@/lib/storage";
import crypto from "crypto";

const FILE = "journal-revisions.json";

/** Keep at most this many revisions per article (newest wins). */
const MAX_PER_ARTICLE = 30;

export async function readRevisions(): Promise<JournalRevision[]> {
  return readJson<JournalRevision[]>(FILE, []);
}

export async function getRevisionsForArticle(
  articleId: string,
): Promise<JournalRevision[]> {
  return (await readRevisions())
    .filter((r) => r.articleId === articleId)
    .sort((a, b) => b.version - a.version);
}

/** Snapshot the article's current state before it is overwritten. */
export async function captureRevision(
  article: JournalArticle,
  updatedBy?: string,
  note?: string,
): Promise<void> {
  const all = await readRevisions();
  const mine = all.filter((r) => r.articleId === article.id);
  const nextVersion =
    mine.reduce((max, r) => Math.max(max, r.version), 0) + 1;

  all.unshift({
    id: crypto.randomBytes(6).toString("hex"),
    articleId: article.id,
    version: nextVersion,
    updatedBy,
    updatedAt: new Date().toISOString(),
    note,
    snapshot: article,
  });

  // Trim old revisions for this article beyond the cap.
  const kept: JournalRevision[] = [];
  const perArticle = new Map<string, number>();
  for (const r of all.sort((a, b) => b.version - a.version)) {
    const n = perArticle.get(r.articleId) ?? 0;
    if (r.articleId === article.id && n >= MAX_PER_ARTICLE) continue;
    perArticle.set(r.articleId, n + 1);
    kept.push(r);
  }
  await writeJson(FILE, kept);
}

export async function getRevision(
  id: string,
): Promise<JournalRevision | undefined> {
  return (await readRevisions()).find((r) => r.id === id);
}
