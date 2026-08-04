import {
  getOrCreateFavoritesDeviceId,
  type FavoritesPayload,
} from "@/lib/favorites";

function apiBase() {
  return process.env.NEXT_PUBLIC_VISITOR_API?.replace(/\/$/, "") ?? "";
}

export function isFavoritesCloudSyncEnabled() {
  return Boolean(apiBase());
}

export async function fetchCloudFavorites(): Promise<FavoritesPayload | null> {
  const base = apiBase();
  if (!base || typeof window === "undefined") return null;

  const token = getOrCreateFavoritesDeviceId();
  if (!token) return null;

  try {
    const url = new URL(`${base}/favorites`);
    url.searchParams.set("token", token);
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<FavoritesPayload> & { keys?: string[]; records?: FavoritesPayload["records"] };
    if (!Array.isArray(data.keys)) return null;
    return {
      v: 2,
      keys: data.keys.filter((k): k is string => typeof k === "string"),
      records: Array.isArray(data.records) ? data.records : [],
      updatedAt: typeof data.updatedAt === "number" ? data.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

export async function pushCloudFavorites(payload: FavoritesPayload): Promise<boolean> {
  const base = apiBase();
  if (!base || typeof window === "undefined") return false;

  const token = getOrCreateFavoritesDeviceId();
  if (!token) return false;

  try {
    const res = await fetch(`${base}/favorites`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        keys: payload.keys,
        records: payload.records,
        updatedAt: payload.updatedAt,
      }),
      keepalive: true,
    });
    return res.ok;
  } catch {
    return false;
  }
}
