import type { Villa } from "@/lib/types";
import { embedUrl } from "@/lib/video";

export function VillaVideo({ video, title }: { video: NonNullable<Villa["video"]>; title: string }) {
  const url = embedUrl(video);
  if (!url) return null;

  if (video.kind === "file") {
    return (
      <video
        src={url}
        poster={video.poster}
        controls
        playsInline
        className="aspect-video w-full rounded-2xl bg-black"
      />
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <iframe
        src={url}
        title={`${title} — video tour`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}
