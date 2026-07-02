import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Local asset paths with optional GitHub Pages basePath prefix. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
/** Optional CDN origin for Bandori assets (e.g. Aliyun OSS) — speeds up China access. */
const assetCdn = process.env.NEXT_PUBLIC_ASSET_CDN?.replace(/\/$/, "") ?? "";

export function assetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const [pathname, query] = path.split("?", 2);
  const segments = pathname.split("/").filter(Boolean);
  const encoded = `/${segments.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/")}`;
  const local = `${basePath}${encoded}`;
  const full =
    assetCdn && encoded.startsWith("/assets/")
      ? `${assetCdn}${encoded}`
      : local;
  return query ? `${full}?${query}` : full;
}
