"use client";

import { useMemo, useState } from "react";
import { getCharacterSdCandidates } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

export function SdFigureImage({
  characterId,
  sdResourceName,
  className,
  alt = "",
}: {
  characterId: number;
  sdResourceName?: string | null;
  className?: string;
  alt?: string;
}) {
  const urls = useMemo(
    () => getCharacterSdCandidates(characterId, sdResourceName),
    [characterId, sdResourceName]
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  if (hidden || urlIndex >= urls.length) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={urls[urlIndex]}
      alt={alt}
      className={cn("sd-figure-image", className)}
      loading="lazy"
      decoding="async"
      onError={() => {
        if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
        else setHidden(true);
      }}
    />
  );
}
