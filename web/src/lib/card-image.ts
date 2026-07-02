import { assetUrl } from "./utils";

const RASTER_EXT = /\.(png|jpe?g)(\?.*)?$/i;

/** Map a full-size asset path to its WebP thumbnail sibling. */
export function cardImageUrl(src: string, variant: "thumb" | "mobile" | "full" = "full") {
  if (!src || variant === "full") return assetUrl(src);
  if (src.startsWith("http://") || src.startsWith("https://")) return assetUrl(src);

  const [pathname, query] = src.split("?", 2);
  if (!RASTER_EXT.test(pathname)) return assetUrl(src);

  const slash = pathname.lastIndexOf("/");
  const dir = pathname.slice(0, slash);
  const file = pathname.slice(slash + 1);
  const base = file.replace(/\.(png|jpe?g)$/i, "");
  const thumbSubdir = variant === "mobile" ? ".thumbs/m" : ".thumbs";
  const thumbPath = `${dir}/${thumbSubdir}/${base}.webp`;
  return assetUrl(query ? `${thumbPath}?${query}` : thumbPath);
}
