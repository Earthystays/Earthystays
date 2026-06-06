import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Skip Next.js's image optimization for uploaded photos. The optimizer
    // intermittently fails on newly-written /uploads/*.jpeg files in
    // production (returns "received null"). Nginx serves /uploads/ directly
    // with proper Content-Type headers via a location block in the server config.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
};

export default nextConfig;
