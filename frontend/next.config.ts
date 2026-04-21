import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  // Rewrites only apply during `next dev` — ignored by static export at build time.
  // This proxies all API calls to the backend so dev uses a single URL (localhost:3000).
  async rewrites() {
    return [
      {
        source: "/deployments/:path*",
        destination: "http://localhost:3001/deployments/:path*",
      },
      {
        source: "/healthz",
        destination: "http://localhost:3001/healthz",
      },
    ];
  },
};

export default nextConfig;
