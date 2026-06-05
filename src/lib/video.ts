import type { Villa } from "@/lib/types";

export type ParsedVideo = NonNullable<Villa["video"]>;

const YT_RE =
  /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i;
const VIMEO_RE = /vimeo\.com\/(?:video\/)?(\d+)/i;

export function parseVideoUrl(input: string | undefined | null): ParsedVideo | null {
  if (!input) return null;
  const url = String(input).trim();
  if (!url) return null;

  const yt = url.match(YT_RE);
  if (yt) return { kind: "youtube", id: yt[1] };

  const vm = url.match(VIMEO_RE);
  if (vm) return { kind: "vimeo", id: vm[1] };

  // Local upload or direct video file URL
  if (
    url.startsWith("/uploads/") ||
    url.startsWith("/") ||
    /\.(mp4|webm|mov)(\?|#|$)/i.test(url)
  ) {
    return { kind: "file", src: url };
  }

  // If it's any other URL, treat as a direct file URL (might be MP4 on CDN)
  if (/^https?:\/\//i.test(url)) {
    return { kind: "file", src: url };
  }

  return null;
}

export function embedUrl(video: ParsedVideo): string {
  switch (video.kind) {
    case "youtube":
      return `https://www.youtube.com/embed/${video.id}?rel=0`;
    case "vimeo":
      return `https://player.vimeo.com/video/${video.id}`;
    case "file":
      return video.src ?? "";
  }
}

export function videoLabel(video: ParsedVideo): string {
  if (video.kind === "youtube") return `YouTube · ${video.id}`;
  if (video.kind === "vimeo") return `Vimeo · ${video.id}`;
  return video.src ?? "Uploaded video";
}
