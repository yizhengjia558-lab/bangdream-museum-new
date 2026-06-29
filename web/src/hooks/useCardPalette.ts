"use client";

import { useEffect, useState } from "react";
import { extractCardPalette } from "@/lib/extract-card-palette";
import { fallbackPalette, getCachedPalette, type CardPalette } from "@/lib/card-palette";

export function useCardPalette(imageSrc: string, accent = "#e9435e"): CardPalette {
  const [palette, setPalette] = useState<CardPalette>(() => {
    return (imageSrc && getCachedPalette(imageSrc)) || fallbackPalette(accent);
  });

  useEffect(() => {
    if (!imageSrc) {
      setPalette(fallbackPalette(accent));
      return;
    }

    const cached = getCachedPalette(imageSrc);
    if (cached) {
      setPalette(cached);
      return;
    }

    let cancelled = false;
    extractCardPalette(imageSrc, accent).then((next) => {
      if (!cancelled) setPalette(next);
    });

    return () => {
      cancelled = true;
    };
  }, [imageSrc, accent]);

  return palette;
}
