import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Local asset paths with optional GitHub Pages basePath prefix. */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

export function assetUrl(path: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const [pathname, query] = path.split("?", 2);
  const segments = pathname.split("/").filter(Boolean);
  const encoded = `/${segments.map((s) => encodeURIComponent(decodeURIComponent(s))).join("/")}`;
  const full = `${basePath}${encoded}`;
  return query ? `${full}?${query}` : full;
}
