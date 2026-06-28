export const FAVORITES_STORAGE_KEY = "bd-favorites";

export function loadFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((k) => typeof k === "string") : [];
  } catch {
    return [];
  }
}

export function saveFavorites(keys: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(keys));
}
