"use client";

import { createContext, useContext, type ReactNode } from "react";
import type Lenis from "lenis";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

/** Native scroll only — Lenis rAF loop was a constant desktop cost. */
export function SmoothScroll({ children }: { children: ReactNode }) {
  return <LenisContext.Provider value={null}>{children}</LenisContext.Provider>;
}
