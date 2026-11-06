import type { NextConfig } from "next";
import { baseUrl } from "./app/lib/constants";

// The browser calls same-origin `/api/v1/*` and Next proxies it to the backend,
// so the API does not need CORS for this app. API_BASE_URL overrides the
// default (e.g. a local or staging backend).
const apiBaseUrl = (process.env.API_BASE_URL || baseUrl).replace(/\/+$/, "");

const nextConfig: NextConfig = {
  images: {
    // Feed and dashboard photos are already sized Unsplash URLs.
    unoptimized: true
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiBaseUrl}/api/v1/:path*`
      }
    ];
  }
};

export default nextConfig;
