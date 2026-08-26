import type { JournalArticle } from "@/lib/journal/types";
import { getAllCategories } from "@/lib/data/journal-categories";
import { getAllAuthors } from "@/lib/data/journal-authors";
import { getAllJournalDestinations } from "@/lib/data/journal-destinations";
import { getBlockEditorOptions } from "@/lib/journal/admin-options";
import { ArticleEditor } from "@/components/journal/admin/article-editor";

export const dynamic = "force-dynamic";
export const metadata = { title: "New article · Journal" };

export default function NewArticlePage() {
  const blank: JournalArticle = {
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    categorySlug: "",
    tags: [],
    blocks: [],
    status: "draft",
    createdAt: "",
    updatedAt: "",
  };

  return (
    <div>
      <h1 className="mb-6 font-display text-4xl">New article</h1>
      <ArticleEditor
        article={blank}
        categories={getAllCategories()}
        authors={getAllAuthors()}
        destinations={getAllJournalDestinations()}
        blockOptions={getBlockEditorOptions()}
      />
    </div>
  );
}
