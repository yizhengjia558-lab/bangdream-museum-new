"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { loadFavorites, saveFavorites } from "@/lib/favorites";

type FavoritesContextValue = {
  favorites: string[];
  count: number;
  isFavorite: (key: string) => boolean;
  toggleFavorite: (key: string) => void;
  removeFavorite: (key: string) => void;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFavorites(loadFavorites());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    saveFavorites(favorites);
  }, [favorites, ready]);

  const isFavorite = useCallback((key: string) => favorites.includes(key), [favorites]);

  const toggleFavorite = useCallback((key: string) => {
    setFavorites((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }, []);

  const removeFavorite = useCallback((key: string) => {
    setFavorites((prev) => prev.filter((k) => k !== key));
  }, []);

  const value = useMemo(
    () => ({
      favorites,
      count: favorites.length,
      isFavorite,
      toggleFavorite,
      removeFavorite,
    }),
    [favorites, isFavorite, toggleFavorite, removeFavorite]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}
