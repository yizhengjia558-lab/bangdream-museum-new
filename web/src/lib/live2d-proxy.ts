import type { BestdoriRegion } from "@/lib/bestdori-assets";

function resolveProxyOrigin() {
  if (typeof window === "undefined") return "";
  const { hostname, port, protocol } = window.location;
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `${protocol}//${hostname}:3002`;
  }
  return "";
}

/** Same-origin proxy path (dev proxy :3002, Cloudflare Pages Function in production). */
export function getLive2DAssetProxyUrl(assetPath: string) {
  const normalized = assetPath.replace(/^\/+/, "");
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  const devOrigin = resolveProxyOrigin();
  if (devOrigin) {
    return `${devOrigin}/bestdori-assets/${normalized}`;
  }
  return `${basePath}/bestdori-assets/${normalized}`;
}

export function getLive2DBuildDataProxyUrl(assetBundleName: string, region: BestdoriRegion = "jp") {
  return getLive2DAssetProxyUrl(`${region}/live2d/chara/${assetBundleName}_rip/buildData.asset`);
}

export function getLive2DBundleAssetProxyUrl(
  bundleName: string,
  fileName: string,
  region: BestdoriRegion = "jp"
) {
  const bundle = bundleName.split("/").pop() ?? bundleName;
  const normalizedFile = fileName.replace(/\.bytes$/i, "");
  return getLive2DAssetProxyUrl(`${region}/live2d/chara/${bundle}_rip/${normalizedFile}`);
}
