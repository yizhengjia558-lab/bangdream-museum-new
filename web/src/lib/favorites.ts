import type { CardData } from "./data-types";
import type { CardDisplayItem, CardVariant } from "./cards";

export const FAVORITES_STORAGE_KEY = "bd-favorites";
export const FAVORITES_DEVICE_KEY = "bd-favorites-device";
const FAVORITES_COOKIE = "bd_favorites";
const FAVORITES_IDB_NAME = "bd-museum";
const FAVORITES_IDB_STORE = "kv";
const STORAGE_VERSION = 2;

export type FavoriteRecord = {
  key: string;
  variant: CardVariant;
  cardId: string;
  bestdoriId?: number | null;
  cardName?: string;
  untrainedFile?: string;
  trainedFile?: string;
};

type FavoritesPayload = {
  v: number;
  keys: string[];
  records: FavoriteRecord[];
  updatedAt: number;
};

function emptyPayload(): FavoritesPayload {
  return { v: STORAGE_VERSION, keys: [], records: [], updatedAt: 0 };
}

function parseVariantKey(key: string): { cardId: string; variant: CardVariant } | null {
  if (key.endsWith("-untrained")) {
    return { cardId: key.slice(0, -"-untrained".length), variant: "untrained" };
  }
  if (key.endsWith("-trained")) {
    return { cardId: key.slice(0, -"-trained".length), variant: "trained" };
  }
  return null;
}

export function makeFavoriteRecord(card: CardData, variant: CardVariant): FavoriteRecord {
  return {
    key: `${card.id}-${variant}`,
    variant,
    cardId: card.id,
    bestdoriId: card.bestdori_card_id ?? null,
    cardName: card.card_name,
    untrainedFile: card.untrained_file || card.untrained_image || undefined,
    trainedFile: card.trained_file || card.trained_image || undefined,
  };
}

function recordFromKey(key: string): FavoriteRecord | null {
  const parsed = parseVariantKey(key);
  if (!parsed) return null;
  return {
    key,
    variant: parsed.variant,
    cardId: parsed.cardId,
  };
}

function normalizeRecords(keys: string[], records: FavoriteRecord[] = []): FavoriteRecord[] {
  const byKey = new Map<string, FavoriteRecord>();
  for (const record of records) {
    if (!record || typeof record.key !== "string") continue;
    byKey.set(record.key, {
      key: record.key,
      variant: record.variant === "trained" ? "trained" : "untrained",
      cardId: String(record.cardId || parseVariantKey(record.key)?.cardId || ""),
      bestdoriId: record.bestdoriId ?? null,
      cardName: record.cardName,
      untrainedFile: record.untrainedFile,
      trainedFile: record.trainedFile,
    });
  }
  for (const key of keys) {
    if (typeof key !== "string" || !key || byKey.has(key)) continue;
    const fallback = recordFromKey(key);
    if (fallback) byKey.set(key, fallback);
  }
  return keys.map((key) => byKey.get(key)).filter((r): r is FavoriteRecord => Boolean(r));
}

function payloadFromLegacyKeys(keys: string[]): FavoritesPayload {
  const unique = Array.from(new Set(keys.filter((k) => typeof k === "string" && k)));
  return {
    v: STORAGE_VERSION,
    keys: unique,
    records: normalizeRecords(unique),
    updatedAt: Date.now(),
  };
}

function parsePayload(raw: string | null | undefined): FavoritesPayload | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return payloadFromLegacyKeys(parsed.filter((k): k is string => typeof k === "string"));
    }
    if (!parsed || typeof parsed !== "object") return null;
    const obj = parsed as Partial<FavoritesPayload> & { items?: string[] };
    const keys = Array.isArray(obj.keys)
      ? obj.keys.filter((k): k is string => typeof k === "string")
      : Array.isArray(obj.items)
        ? obj.items.filter((k): k is string => typeof k === "string")
        : [];
    const records = Array.isArray(obj.records) ? normalizeRecords(keys, obj.records as FavoriteRecord[]) : normalizeRecords(keys);
    return {
      v: STORAGE_VERSION,
      keys: Array.from(new Set(keys)),
      records,
      updatedAt: typeof obj.updatedAt === "number" ? obj.updatedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

function serializePayload(payload: FavoritesPayload): string {
  return JSON.stringify({
    v: STORAGE_VERSION,
    keys: payload.keys,
    records: payload.records,
    updatedAt: payload.updatedAt || Date.now(),
  });
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const parts = document.cookie.split("; ");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    if (decodeURIComponent(part.slice(0, idx)) === name) {
      return decodeURIComponent(part.slice(idx + 1));
    }
  }
  return null;
}

function writeCookie(name: string, value: string, maxAgeSec = 60 * 60 * 24 * 400) {
  if (typeof document === "undefined") return;
  // Keep under typical 4KB cookie limits; skip oversized payloads.
  if (value.length > 3500) return;
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)};path=/;max-age=${maxAgeSec};SameSite=Lax`;
}

function openFavoritesDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(FAVORITES_IDB_NAME, 1);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(FAVORITES_IDB_STORE)) {
          db.createObjectStore(FAVORITES_IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openFavoritesDb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FAVORITES_IDB_STORE, "readonly");
      const store = tx.objectStore(FAVORITES_IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => {
        const value = req.result;
        resolve(typeof value === "string" ? value : null);
      };
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openFavoritesDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(FAVORITES_IDB_STORE, "readwrite");
      tx.objectStore(FAVORITES_IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

function readLocalStorageRaw(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(FAVORITES_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLocalStorageRaw(value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, value);
  } catch {
    /* quota / private mode */
  }
}

function pickNewest(...candidates: Array<FavoritesPayload | null>): FavoritesPayload {
  const valid = candidates.filter((c): c is FavoritesPayload => Boolean(c));
  if (valid.length === 0) return emptyPayload();
  valid.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || b.keys.length - a.keys.length);
  return valid[0];
}

function mergePayloads(...payloads: FavoritesPayload[]): FavoritesPayload {
  const keyOrder: string[] = [];
  const seen = new Set<string>();
  const byKey = new Map<string, FavoriteRecord>();

  for (const payload of payloads) {
    for (const record of payload.records) {
      const existing = byKey.get(record.key);
      if (!existing || (!!record.bestdoriId && !existing.bestdoriId) || (!!record.cardName && !existing.cardName)) {
        byKey.set(record.key, { ...existing, ...record });
      }
    }
    for (const key of payload.keys) {
      if (seen.has(key)) continue;
      seen.add(key);
      keyOrder.push(key);
      if (!byKey.has(key)) {
        const fallback = recordFromKey(key);
        if (fallback) byKey.set(key, fallback);
      }
    }
  }

  return {
    v: STORAGE_VERSION,
    keys: keyOrder,
    records: keyOrder.map((key) => byKey.get(key)).filter((r): r is FavoriteRecord => Boolean(r)),
    updatedAt: Math.max(0, ...payloads.map((p) => p.updatedAt || 0), Date.now()),
  };
}

export function loadFavorites(): string[] {
  return loadFavoritesPayload().keys;
}

export function loadFavoritesPayload(): FavoritesPayload {
  if (typeof window === "undefined") return emptyPayload();
  const fromLs = parsePayload(readLocalStorageRaw());
  const fromCookie = parsePayload(readCookie(FAVORITES_COOKIE));
  return pickNewest(fromLs, fromCookie);
}

/** Async load merges localStorage, cookie, and IndexedDB backups. */
export async function loadFavoritesPayloadAsync(): Promise<FavoritesPayload> {
  if (typeof window === "undefined") return emptyPayload();
  const sync = loadFavoritesPayload();
  const fromIdb = parsePayload(await idbGet(FAVORITES_STORAGE_KEY));
  const merged = pickNewest(sync, fromIdb);
  // Heal any layer that lagged behind.
  if (merged.keys.length > 0) {
    await saveFavoritesPayload(merged);
  }
  return merged;
}

export function saveFavorites(keys: string[]) {
  const current = loadFavoritesPayload();
  const records = normalizeRecords(keys, current.records);
  void saveFavoritesPayload({
    v: STORAGE_VERSION,
    keys: Array.from(new Set(keys.filter((k) => typeof k === "string" && k))),
    records,
    updatedAt: Date.now(),
  });
}

export async function saveFavoritesPayload(payload: FavoritesPayload): Promise<void> {
  if (typeof window === "undefined") return;
  const normalized: FavoritesPayload = {
    v: STORAGE_VERSION,
    keys: Array.from(new Set(payload.keys.filter((k) => typeof k === "string" && k))),
    records: normalizeRecords(payload.keys, payload.records),
    updatedAt: payload.updatedAt || Date.now(),
  };
  const raw = serializePayload(normalized);
  writeLocalStorageRaw(raw);
  writeCookie(FAVORITES_COOKIE, raw);
  await idbSet(FAVORITES_STORAGE_KEY, raw);
}

export function getOrCreateFavoritesDeviceId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = localStorage.getItem(FAVORITES_DEVICE_KEY) || readCookie(FAVORITES_DEVICE_KEY);
    if (existing && existing.length >= 8) {
      localStorage.setItem(FAVORITES_DEVICE_KEY, existing);
      writeCookie(FAVORITES_DEVICE_KEY, existing);
      return existing;
    }
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(FAVORITES_DEVICE_KEY, id);
    writeCookie(FAVORITES_DEVICE_KEY, id);
    return id;
  } catch {
    return `fav-${Date.now().toString(36)}`;
  }
}

export function upsertFavoriteRecord(
  keys: string[],
  records: FavoriteRecord[],
  next: FavoriteRecord,
  enabled: boolean
): { keys: string[]; records: FavoriteRecord[] } {
  if (enabled) {
    const without = keys.filter((k) => k !== next.key);
    const nextKeys = [...without, next.key];
    const nextRecords = normalizeRecords(nextKeys, [...records.filter((r) => r.key !== next.key), next]);
    return { keys: nextKeys, records: nextRecords };
  }
  const nextKeys = keys.filter((k) => k !== next.key);
  return { keys: nextKeys, records: normalizeRecords(nextKeys, records.filter((r) => r.key !== next.key)) };
}

function fileMatches(card: CardData, record: FavoriteRecord): boolean {
  const cardUntrained = card.untrained_file || card.untrained_image || "";
  const cardTrained = card.trained_file || card.trained_image || "";
  if (record.untrainedFile && cardUntrained && record.untrainedFile === cardUntrained) return true;
  if (record.trainedFile && cardTrained && record.trainedFile === cardTrained) return true;
  return false;
}

/** Remap stored favorites onto the current catalog (handles card id format changes). */
export function migrateFavoritesToCatalog(
  payload: FavoritesPayload,
  displays: CardDisplayItem[]
): FavoritesPayload {
  if (!payload.keys.length || !displays.length) return payload;

  const byKey = new Map(displays.map((d) => [d.key, d]));
  const byBestdori = new Map<string, CardDisplayItem>();
  const byFile = new Map<string, CardDisplayItem>();
  const byName = new Map<string, CardDisplayItem[]>();

  for (const display of displays) {
    const bestdori = display.card.bestdori_card_id;
    if (bestdori != null) byBestdori.set(`${bestdori}-${display.variant}`, display);
    if (display.src) byFile.set(`${display.src}::${display.variant}`, display);
    const name = display.card.card_name?.trim().toLowerCase();
    if (name) {
      const list = byName.get(`${name}::${display.variant}`) || [];
      list.push(display);
      byName.set(`${name}::${display.variant}`, list);
    }
  }

  const nextKeys: string[] = [];
  const nextRecords: FavoriteRecord[] = [];
  const seen = new Set<string>();

  for (const key of payload.keys) {
    const record = payload.records.find((r) => r.key === key) || recordFromKey(key);
    if (!record) continue;

    let match = byKey.get(key) || null;

    if (!match && record.bestdoriId != null) {
      match = byBestdori.get(`${record.bestdoriId}-${record.variant}`) || null;
    }

    if (!match) {
      const parsed = parseVariantKey(key);
      if (parsed) {
        match =
          byBestdori.get(`${parsed.cardId}-${parsed.variant}`) ||
          displays.find(
            (d) =>
              d.variant === parsed.variant &&
              (d.card.id === parsed.cardId || String(d.card.bestdori_card_id ?? "") === parsed.cardId)
          ) ||
          null;
      }
    }

    if (!match && (record.untrainedFile || record.trainedFile)) {
      match =
        displays.find((d) => d.variant === record.variant && fileMatches(d.card, record)) || null;
    }

    if (!match && record.cardName) {
      const candidates = byName.get(`${record.cardName.trim().toLowerCase()}::${record.variant}`) || [];
      if (candidates.length === 1) match = candidates[0];
    }

    if (!match) {
      // Keep orphan keys so cloud/local count is preserved; UI can still show count.
      if (!seen.has(key)) {
        seen.add(key);
        nextKeys.push(key);
        nextRecords.push(record);
      }
      continue;
    }

    const migrated = makeFavoriteRecord(match.card, match.variant);
    if (seen.has(migrated.key)) continue;
    seen.add(migrated.key);
    nextKeys.push(migrated.key);
    nextRecords.push({
      ...migrated,
      // Preserve any richer hints that still help future migrations.
      untrainedFile: migrated.untrainedFile || record.untrainedFile,
      trainedFile: migrated.trainedFile || record.trainedFile,
      cardName: migrated.cardName || record.cardName,
    });
  }

  const changed =
    nextKeys.length !== payload.keys.length || nextKeys.some((key, i) => key !== payload.keys[i]);

  return {
    v: STORAGE_VERSION,
    keys: nextKeys,
    records: nextRecords,
    updatedAt: changed ? Date.now() : payload.updatedAt,
  };
}

export function resolveFavoriteDisplays(
  favorites: string[],
  records: FavoriteRecord[],
  displays: CardDisplayItem[]
): CardDisplayItem[] {
  const migrated = migrateFavoritesToCatalog(
    { v: STORAGE_VERSION, keys: favorites, records, updatedAt: 0 },
    displays
  );
  const byKey = new Map(displays.map((d) => [d.key, d]));
  return migrated.keys.map((key) => byKey.get(key)).filter((d): d is CardDisplayItem => Boolean(d));
}

export function mergeFavoritePayloads(...payloads: FavoritesPayload[]): FavoritesPayload {
  return mergePayloads(...payloads.filter((p) => p.keys.length > 0 || p.records.length > 0), emptyPayload());
}

export type { FavoritesPayload };
