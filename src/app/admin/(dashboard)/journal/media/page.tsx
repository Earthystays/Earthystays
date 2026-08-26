import { readMedia } from "@/lib/data/journal-media";
import { MediaLibrary } from "./library";

export const dynamic = "force-dynamic";
export const metadata = { title: "Media · Journal" };

export default async function JournalMediaPage() {
  const media = await readMedia();
  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-4xl">Media library</h1>
        <p className="mt-2 text-muted-foreground">
          Central store for Journal imagery. Uploads are compressed and resized
          automatically. Add alt text, captions and credits, then copy a URL to
          reuse anywhere.
        </p>
      </header>
      <MediaLibrary initial={media} />
    </div>
  );
}
