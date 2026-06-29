"use client";

import { useMemo, useState } from "react";
import { getCharacterSdCandidates } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "character-chibi--sm",
  md: "character-chibi--md",
  lg: "character-chibi--lg",
};

/** Bestdori LIVE SD 立绘（Q 版小人） */
export function CharacterChibiAvatar({
  characterId,
  sdResourceName,
  className,
  size = "md",
  alt = "",
}: {
  characterId: number;
  sdResourceName?: string | null;
  className?: string;
  size?: Size;
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
    <div className={cn("character-chibi", sizeClass[size], className)} aria-hidden={!alt}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={urls[urlIndex]}
        alt={alt}
        className="character-chibi__img"
        loading="lazy"
        decoding="async"
        onError={() => {
          if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
          else setHidden(true);
        }}
      />
    </div>
  );
}
