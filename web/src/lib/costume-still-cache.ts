/** In-memory + sessionStorage cache for Live2D still frames (data URLs). */

const MEMORY = new Map<string, string>();
const STORAGE_PREFIX = "bd-l2d-still:v1:";
const MAX_STORAGE_ENTRIES = 40;

function storageKey(bundle: string) {
  return `${STORAGE_PREFIX}${bundle}`;
}

export function getCostumeStill(bundle: string): string | null {
  const mem = MEMORY.get(bundle);
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(storageKey(bundle));
    if (saved?.startsWith("data:image")) {
      MEMORY.set(bundle, saved);
      return saved;
    }
  } catch {
    /* private mode / quota */
  }
  return null;
}

export function setCostumeStill(bundle: string, dataUrl: string) {
  if (!dataUrl.startsWith("data:image")) return;
  MEMORY.set(bundle, dataUrl);
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(storageKey(bundle), dataUrl);
    // Soft cap: drop oldest keys when too many stills accumulate.
    const keys = Object.keys(sessionStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
    if (keys.length > MAX_STORAGE_ENTRIES) {
      keys
        .slice(0, keys.length - MAX_STORAGE_ENTRIES)
        .forEach((k) => sessionStorage.removeItem(k));
    }
  } catch {
    /* ignore quota errors */
  }
}

export function getCostumeThumbDirectUrl(
  costumeId: number,
  assetBundleName: string,
  region: "jp" | "cn" | "en" | "kr" | "tw" = "jp"
) {
  const group = Math.floor(costumeId / 50);
  return `https://bestdori.com/assets/${region}/thumb/costume/group${group}_rip/${assetBundleName}.png`;
}
