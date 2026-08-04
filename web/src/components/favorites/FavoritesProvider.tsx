"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getOrCreateFavoritesDeviceId,
  loadFavoritesPayloadAsync,
  makeFavoriteRecord,
  mergeFavoritePayloads,
  migrateFavoritesToCatalog,
  saveFavoritesPayload,
  type FavoriteRecord,
  type FavoritesPayload,
} from "@/lib/favorites";
import { fetchCloudFavorites, isFavoritesCloudSyncEnabled, pushCloudFavorites } from "@/lib/favorites-sync";
import type { CardData } from "@/lib/data-types";
import type { CardDisplayItem, CardVariant } from "@/lib/cards";

type FavoritesContextValue = {
  favorites: string[];
  records: FavoriteRecord[];
  count: number;
  ready: boolean;
  isFavorite: (key: string) => boolean;
  toggleFavorite: (key: string, card?: CardData, variant?: CardVariant) => void;
  removeFavorite: (key: string) => void;
  reconcileWithDisplays: (displays: CardDisplayItem[]) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

function payloadOf(keys: string[], records: FavoriteRecord[], updatedAt = Date.now()): FavoritesPayload {
  return { v: 2, keys, records, updatedAt };
}

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [records, setRecords] = useState<FavoriteRecord[]>([]);
  const [ready, setReady] = useState(false);
  const hydratedRef = useRef(false);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestRef = useRef<FavoritesPayload>(payloadOf([], [], 0));
  const skipNextPersistRef = useRef(false);

  const persist = useCallback(async (next: FavoritesPayload, opts?: { syncCloud?: boolean }) => {
    latestRef.current = next;
    await saveFavoritesPayload(next);
    if (opts?.syncCloud === false || !isFavoritesCloudSyncEnabled()) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      void pushCloudFavorites(latestRef.current);
    }, 400);
  }, []);

  const applyPayload = useCallback(
    (next: FavoritesPayload, opts?: { syncCloud?: boolean }) => {
      latestRef.current = next;
      skipNextPersistRef.current = true;
      setFavorites(next.keys);
      setRecords(next.records);
      void persist(next, opts);
    },
    [persist]
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      getOrCreateFavoritesDeviceId();
      const local = await loadFavoritesPayloadAsync();
      let merged = local;

      if (isFavoritesCloudSyncEnabled()) {
        const remote = await fetchCloudFavorites();
        if (remote) merged = mergeFavoritePayloads(local, remote);
      }

      if (cancelled) return;

      hydratedRef.current = true;
      setReady(true);
      applyPayload(merged);
    }

    void hydrate();
    return () => {
      cancelled = true;
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [applyPayload]);

  useEffect(() => {
    if (!ready || !hydratedRef.current) return;
    if (skipNextPersistRef.current) {
      skipNextPersistRef.current = false;
      return;
    }
    const next = payloadOf(favorites, records, Date.now());
    void persist(next);
  }, [favorites, records, ready, persist]);

  const isFavorite = useCallback((key: string) => favorites.includes(key), [favorites]);

  const toggleFavorite = useCallback((key: string, card?: CardData, variant?: CardVariant) => {
    setFavorites((prevKeys) => {
      const exists = prevKeys.includes(key);
      const nextKeys = exists ? prevKeys.filter((k) => k !== key) : [...prevKeys, key];

      setRecords((prevRecords) => {
        if (exists) return prevRecords.filter((r) => r.key !== key);
        const record =
          card && variant
            ? makeFavoriteRecord(card, variant)
            : prevRecords.find((r) => r.key === key) || {
                key,
                variant: key.endsWith("-trained") ? ("trained" as const) : ("untrained" as const),
                cardId: key.replace(/-(untrained|trained)$/, ""),
              };
        return [...prevRecords.filter((r) => r.key !== key), record];
      });

      return nextKeys;
    });
  }, []);

  const removeFavorite = useCallback((key: string) => {
    setFavorites((prev) => prev.filter((k) => k !== key));
    setRecords((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const reconcileWithDisplays = useCallback(
    (displays: CardDisplayItem[]) => {
      if (!displays.length) return;
      const current = latestRef.current;
      const migrated = migrateFavoritesToCatalog(current, displays);
      const changed =
        migrated.keys.length !== current.keys.length ||
        migrated.keys.some((key, i) => key !== current.keys[i]);
      if (!changed) return;
      applyPayload(migrated);
    },
    [applyPayload]
  );

  const value = useMemo(
    () => ({
      favorites,
      records,
      count: favorites.length,
      ready,
      isFavorite,
      toggleFavorite,
      removeFavorite,
      reconcileWithDisplays,
    }),
    [favorites, records, ready, isFavorite, toggleFavorite, removeFavorite, reconcileWithDisplays]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
