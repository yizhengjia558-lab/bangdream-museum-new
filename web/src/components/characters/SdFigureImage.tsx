"use client";

import { useMemo, useState } from "react";
import { SdSpriteFrame } from "@/components/characters/SdSpriteFrame";
import { getCharacterSdCandidates, getSchoolUniformSdCandidates } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

export function SdFigureImage({
  characterId,
  sdResourceName,
  uniformOnly = false,
  className,
  imgClassName,
  alt = "",
}: {
  characterId: number;
  sdResourceName?: string | null;
  uniformOnly?: boolean;
  className?: string;
  imgClassName?: string;
  alt?: string;
}) {
  const urls = useMemo(
    () =>
      uniformOnly
        ? getSchoolUniformSdCandidates(characterId)
        : getCharacterSdCandidates(characterId, sdResourceName),
    [characterId, sdResourceName, uniformOnly]
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const [hidden, setHidden] = useState(false);

  if (hidden || urlIndex >= urls.length) return null;

  return (
    <SdSpriteFrame
      src={urls[urlIndex]}
      alt={alt}
      className={cn("sd-figure-image", className)}
      imgClassName={imgClassName}
      onError={() => {
        if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
        else setHidden(true);
      }}
    />
  );
}
