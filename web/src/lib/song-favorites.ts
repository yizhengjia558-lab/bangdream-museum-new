const STORAGE_KEY = "bd-song-favorites";
const STORAGE_VERSION = 1;

export type SongFavoritesPayload = {
  v: number;
  ids: number[];
  updatedAt: number;
};

function emptyPayload(): SongFavoritesPayload {
  return { v: STORAGE_VERSION, ids: [], updatedAt: 0 };
}

function normalize(ids: number[]): number[] {
  const seen = new Set<number>();
  const next: number[] = [];
  for (const id of ids) {
    const n = Number(id);
    if (!Number.isFinite(n) || seen.has(n)) continue;
    seen.add(n);
    next.push(n);
  }
  return next;
}

export function parseSongFavoritesPayload(raw: unknown): SongFavoritesPayload {
  if (!raw || typeof raw !== "object") return emptyPayload();
  const obj = raw as { v?: number; ids?: unknown; updatedAt?: unknown };
  const ids = Array.isArray(obj.ids)
    ? normalize(obj.ids.map((id) => Number(id)))
    : [];
  return {
    v: STORAGE_VERSION,
    ids,
    updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
  };
}

export function loadSongFavorites(): SongFavoritesPayload {
  if (typeof window === "undefined") return emptyPayload();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPayload();
    return parseSongFavoritesPayload(JSON.parse(raw));
  } catch {
    return emptyPayload();
  }
}

export function saveSongFavorites(payload: SongFavoritesPayload) {
  if (typeof window === "undefined") return;
  const next = {
    v: STORAGE_VERSION,
    ids: normalize(payload.ids),
    updatedAt: payload.updatedAt || Date.now(),
  };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // quota / private mode
  }
}

export function toggleSongFavoriteId(ids: number[], songId: number): number[] {
  if (ids.includes(songId)) return ids.filter((id) => id !== songId);
  return [...ids, songId];
}
