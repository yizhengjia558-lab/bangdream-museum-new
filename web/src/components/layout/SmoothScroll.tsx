"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import Lenis from "lenis";
import { useMobilePerf } from "@/hooks/useMobilePerf";

const LenisContext = createContext<Lenis | null>(null);

export function useLenis() {
  return useContext(LenisContext);
}

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const mobile = useMobilePerf();

  useEffect(() => {
    if (mobile) {
      setLenis(null);
      return;
    }

    const instance = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    setLenis(instance);

    function raf(time: number) {
      instance.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
    return () => {
      instance.destroy();
      setLenis(null);
    };
  }, [mobile]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
