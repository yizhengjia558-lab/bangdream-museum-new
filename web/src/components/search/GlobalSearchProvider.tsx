"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";

interface GlobalSearchContextValue {
  query: string;
  setQuery: (query: string) => void;
  clearQuery: () => void;
  hasQuery: boolean;
}

const GlobalSearchContext = createContext<GlobalSearchContextValue | null>(null);

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [query, setQueryState] = useState("");

  useEffect(() => {
    setQueryState("");
  }, [pathname]);

  const setQuery = useCallback((value: string) => {
    setQueryState(value);
  }, []);

  const clearQuery = useCallback(() => {
    setQueryState("");
  }, []);

  const value = useMemo(
    () => ({
      query,
      setQuery,
      clearQuery,
      hasQuery: query.trim().length > 0,
    }),
    [query, setQuery, clearQuery]
  );

  return <GlobalSearchContext.Provider value={value}>{children}</GlobalSearchContext.Provider>;
}

export function useGlobalSearch() {
  const ctx = useContext(GlobalSearchContext);
  if (!ctx) throw new Error("useGlobalSearch must be used within GlobalSearchProvider");
  return ctx;
}
