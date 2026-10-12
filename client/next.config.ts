import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "www.facebook.com" },
      { protocol: "https", hostname: "www.google.com" },
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
  // experimental: {},
};

export default nextConfig;
