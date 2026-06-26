import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const configDir = path.dirname(fileURLToPath(import.meta.url));
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  turbopack: {
    root: configDir,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "bestdori.com" },
      { protocol: "https", hostname: "i.bandori.party" },
    ],
  },
};

export default nextConfig;
