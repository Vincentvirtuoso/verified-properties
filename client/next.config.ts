import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "www.facebook.com" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
    ],
    minimumCacheTTL: 60 * 60 * 24,
  },
  transpilePackages: ["@affilhomes/shared"],
  // experimental: {},
};

export default nextConfig;
