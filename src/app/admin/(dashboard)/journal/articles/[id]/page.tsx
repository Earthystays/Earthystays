import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleById } from "@/lib/data/journal";
import { getAllCategories } from "@/lib/data/journal-categories";
import { getAllAuthors } from "@/lib/data/journal-authors";
import { getAllJournalDestinations } from "@/lib/data/journal-destinations";
import { getRevisionsForArticle } from "@/lib/data/journal-revisions";
import { getBlockEditorOptions } from "@/lib/journal/admin-options";
import { ArticleEditor } from "@/components/journal/admin/article-editor";
import { RevisionList } from "../../revision-list";

export const dynamic = "force-dynamic";
export const metadata = { title: "Edit article · Journal" };

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = getArticleById(id);
  if (!article) notFound();

  const revisions = await getRevisionsForArticle(id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin/journal/articles" className="text-sm text-muted-foreground hover:text-foreground">
            ← All articles
          </Link>
          <h1 className="mt-1 font-display text-4xl">Edit article</h1>
        </div>
      </div>

      <ArticleEditor
        article={article}
        categories={getAllCategories()}
        authors={getAllAuthors()}
        destinations={getAllJournalDestinations()}
        blockOptions={getBlockEditorOptions()}
      />

      {revisions.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 font-display text-2xl">Version history</h2>
          <RevisionList revisions={revisions.map((r) => ({
            id: r.id,
            version: r.version,
            updatedAt: r.updatedAt,
            updatedBy: r.updatedBy,
            note: r.note,
          }))} />
        </div>
      )}
    </div>
  );
}
