"use server";

import { requireAdmin } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/admin-audit";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import type { JournalArticle, JournalStatus } from "@/lib/journal/types";
import {
  readArticles,
  saveArticles,
  estimateReadingTime,
} from "@/lib/data/journal";
import { captureRevision, getRevision } from "@/lib/data/journal-revisions";
import { slugify } from "@/lib/slug";

const EDITOR = "Admin User";

function revalidateArticle(slug?: string) {
  revalidatePath("/journal");
  revalidatePath("/journal/search");
  revalidatePath("/admin/journal");
  revalidatePath("/admin/journal/articles");
  if (slug) revalidatePath(`/journal/${slug}`);
}

/** Ensure the slug is unique across all articles except `exceptId`. */
function uniqueSlug(list: JournalArticle[], base: string, exceptId?: string): string {
  let slug = base || "untitled";
  let n = 2;
  while (list.some((a) => a.slug === slug && a.id !== exceptId)) {
    slug = `${base}-${n++}`;
  }
  return slug;
}

export type SaveArticleInput = Omit<
  JournalArticle,
  "createdAt" | "updatedAt" | "createdBy" | "updatedBy"
> & { id?: string };

/** Create or update an article from the editor's serialized JSON payload. */
export async function saveArticle(
  payload: SaveArticleInput,
): Promise<{ ok: boolean; error?: string; id?: string; slug?: string }> {
  await requireAdmin();
  if (!payload.title?.trim()) return { ok: false, error: "Title is required." };
  if (!payload.categorySlug) return { ok: false, error: "Choose a category." };

  const list = await readArticles();
  const now = new Date().toISOString();
  const existing = payload.id ? list.find((a) => a.id === payload.id) : undefined;

  const desiredSlug = slugify(payload.slug || payload.title);
  const slug = uniqueSlug(list, desiredSlug, existing?.id);

  // Track old slug for redirects (spec §35).
  let previousSlugs = existing?.previousSlugs ?? [];
  if (existing && existing.slug !== slug) {
    previousSlugs = Array.from(new Set([...previousSlugs, existing.slug]));
  }

  const readingTime =
    payload.readingTime && payload.readingTime > 0
      ? payload.readingTime
      : estimateReadingTime(payload.blocks ?? []);

  // Snapshot the previous state before overwriting (spec §30).
  if (existing) {
    await captureRevision(existing, EDITOR);
  }

  const article: JournalArticle = {
    ...(existing ?? {}),
    ...payload,
    id: existing?.id ?? `art-${crypto.randomBytes(5).toString("hex")}`,
    slug,
    previousSlugs,
    tags: payload.tags ?? [],
    blocks: payload.blocks ?? [],
    readingTime,
    status: payload.status ?? "draft",
    // Stamp publishedAt the first time it goes live.
    publishedAt:
      payload.status === "published"
        ? existing?.publishedAt ?? payload.publishedAt ?? now
        : payload.publishedAt,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    createdBy: existing?.createdBy ?? EDITOR,
    updatedBy: EDITOR,
  };

  const next = existing
    ? list.map((a) => (a.id === article.id ? article : a))
    : [article, ...list];

  await saveArticles(next);
  await logAdminAction({
    action:
      article.status === "published"
        ? "journal.article_published"
        : "journal.article_saved",
    entity: "journal_article",
    entityId: article.id,
    summary: `Article saved (${article.status}): ${article.title ?? article.slug}`,
  });
  revalidateArticle(article.slug);
  return { ok: true, id: article.id, slug: article.slug };
}

export async function setArticleStatus(
  id: string,
  status: JournalStatus,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readArticles();
  const article = list.find((a) => a.id === id);
  if (!article) return { ok: false };
  await captureRevision(article, EDITOR);
  article.status = status;
  article.updatedAt = new Date().toISOString();
  article.updatedBy = EDITOR;
  if (status === "published" && !article.publishedAt) {
    article.publishedAt = new Date().toISOString();
  }
  await saveArticles(list);
  await logAdminAction({
    action:
      status === "published"
        ? "journal.article_published"
        : "journal.article_unpublished",
    entity: "journal_article",
    entityId: id,
    summary: `Article ${status}: ${article.title ?? article.slug}`,
  });
  revalidateArticle(article.slug);
  return { ok: true };
}

export async function duplicateArticle(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readArticles();
  const src = list.find((a) => a.id === id);
  if (!src) return { ok: false };
  const now = new Date().toISOString();
  const base = slugify(`${src.title}-copy`);
  const copy: JournalArticle = {
    ...src,
    id: `art-${crypto.randomBytes(5).toString("hex")}`,
    slug: uniqueSlug(list, base),
    previousSlugs: [],
    title: `${src.title} (Copy)`,
    status: "draft",
    publishedAt: undefined,
    scheduledFor: undefined,
    editorsPickRank: undefined,
    views: 0,
    propertyClicks: 0,
    experienceClicks: 0,
    bookingClicks: 0,
    shares: 0,
    createdAt: now,
    updatedAt: now,
  };
  await saveArticles([copy, ...list]);
  revalidateArticle();
  return { ok: true };
}

export async function deleteArticle(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readArticles();
  const article = list.find((a) => a.id === id);
  await saveArticles(list.filter((a) => a.id !== id));
  await logAdminAction({
    action: "journal.article_deleted",
    entity: "journal_article",
    entityId: id,
    summary: `Article deleted: ${article?.title ?? id}`,
  });
  revalidateArticle(article?.slug);
  return { ok: true };
}

/** Restore a prior revision's body/meta onto the live article (spec §30). */
export async function restoreRevision(
  revisionId: string,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const rev = await getRevision(revisionId);
  if (!rev) return { ok: false, error: "Revision not found." };
  const list = await readArticles();
  const current = list.find((a) => a.id === rev.articleId);
  if (!current) return { ok: false, error: "Article no longer exists." };

  // Snapshot current before restoring so the restore itself is reversible.
  await captureRevision(current, EDITOR, "before restore");

  const restored: JournalArticle = {
    ...rev.snapshot,
    // Keep live counters and identity; restore content/meta.
    id: current.id,
    views: current.views,
    propertyClicks: current.propertyClicks,
    experienceClicks: current.experienceClicks,
    bookingClicks: current.bookingClicks,
    shares: current.shares,
    updatedAt: new Date().toISOString(),
    updatedBy: EDITOR,
  };
  await saveArticles(list.map((a) => (a.id === current.id ? restored : a)));
  revalidateArticle(restored.slug);
  return { ok: true };
}

/** Reorder / set editor's-pick ranks from the dashboard. */
export async function setEditorsPickRank(
  id: string,
  rank: number | undefined,
): Promise<{ ok: boolean }> {
  await requireAdmin();
  const list = await readArticles();
  const article = list.find((a) => a.id === id);
  if (!article) return { ok: false };
  article.editorsPickRank = rank;
  article.updatedAt = new Date().toISOString();
  await saveArticles(list);
  revalidateArticle(article.slug);
  return { ok: true };
}
