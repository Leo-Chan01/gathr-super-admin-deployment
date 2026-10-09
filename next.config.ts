import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Feed and dashboard photos are already sized Unsplash URLs.
    unoptimized: true
  }
};

export default nextConfig;
