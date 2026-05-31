import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static build for GitHub Pages, served under
// /aria on the custom domain. The server API routes are excluded in this mode
// (see scripts/build-static.sh); the client falls back to direct calls.
const isStatic = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStatic
  ? {
      output: "export",
      basePath: "/aria",
      assetPrefix: "/aria",
      images: { unoptimized: true },
      trailingSlash: true,
      env: {
        NEXT_PUBLIC_STATIC: "1",
        NEXT_PUBLIC_BASE_PATH: "/aria",
      },
    }
  : {};

export default nextConfig;
