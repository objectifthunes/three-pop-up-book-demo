import type { NextConfig } from "next";

const isCI = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isCI ? "/three-pop-up-book-demo" : undefined,
  assetPrefix: isCI ? "/three-pop-up-book-demo/" : undefined,
  trailingSlash: true,
  // The interactive demo is vendored from the library's own Vite demo; it is
  // type-checked there. Don't fail the docs build on its type quirks.
  typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
