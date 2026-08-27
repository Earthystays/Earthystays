import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Optimization is ON. It was previously disabled (`unoptimized: true`)
    // because the optimizer intermittently failed on newly-written
    // /uploads/* files with "received null". The cause was a non-atomic
    // fs.writeFile in the upload route: a request landing mid-write read a
    // short or empty file. Uploads now write to a temp name and rename into
    // place (see writeFileAtomic in api/admin/upload), which closes that
    // window — so the optimizer can be trusted again.
    //
    // WebP only, deliberately: AVIF encodes far slower and this is a small
    // shared VPS. WebP already gives most of the saving.
    formats: ["image/webp"],
    // Uploaded filenames embed a timestamp + random id and are never
    // rewritten, so a derivative stays valid forever. Cache hard.
    minimumCacheTTL: 31536000,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      // Google reviewer avatars (Places API review import)
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
