"use client";

import { useEffect, useMemo, useState } from "react";
import { SdPoseOverview } from "@/components/characters/SdPoseOverview";
import { SdSpriteFrame } from "@/components/characters/SdSpriteFrame";
import { getCharacterSdCandidates, getSchoolUniformSdCandidates } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const sizeClass: Record<Size, string> = {
  sm: "character-chibi--sm",
  md: "character-chibi--md",
  lg: "character-chibi--lg",
};

/** 成员页校服 Q 版 — 默认展示，可点击放大 */
export function CharacterChibiAvatar({
  characterId,
  className,
  size = "md",
  alt = "",
}: {
  characterId: number;
  className?: string;
  size?: Size;
  alt?: string;
}) {
  const urls = useMemo(() => getSchoolUniformSdCandidates(characterId), [characterId]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setUrlIndex(0);
    setHidden(false);
  }, [characterId, urls]);

  if (hidden || urlIndex >= urls.length) return null;

  const activeUrl = urls[urlIndex];

  return (
    <>
      <div className={cn("character-chibi character-chibi--interactive", sizeClass[size], className)}>
        <SdSpriteFrame
          src={activeUrl}
          alt={alt}
          contain
          className="character-chibi__frame"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <button
          type="button"
          className="character-chibi__zoom"
          aria-label={alt ? `${alt} Q版总览` : "Q版总览"}
          onClick={() => setPreviewOpen(true)}
        >
          🔍
        </button>
      </div>

      {previewOpen ? (
        <SdPoseOverview src={activeUrl} alt={alt} caption={alt} onClose={() => setPreviewOpen(false)} />
      ) : null}
    </>
  );
}

/** 卡面详情 Q 版 — 默认站姿，点击查看 Bestdori 四态总览 */
export function CardSdFigurePreview({
  characterId,
  sdResourceName,
  alt = "",
  className,
}: {
  characterId: number;
  sdResourceName?: string | null;
  alt?: string;
  className?: string;
}) {
  const urls = useMemo(
    () => getCharacterSdCandidates(characterId, sdResourceName),
    [characterId, sdResourceName]
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    setUrlIndex(0);
    setHidden(false);
  }, [characterId, sdResourceName, urls]);

  if (hidden || urlIndex >= urls.length) return null;

  const activeUrl = urls[urlIndex];

  return (
    <>
      <div className={cn("card-sd-preview", className)}>
        <SdSpriteFrame
          key={activeUrl}
          src={activeUrl}
          alt={alt}
          contain
          className="card-sd-preview__frame"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <button
          type="button"
          className="card-sd-preview__zoom"
          aria-label={alt ? `${alt} Q版总览` : "Q版总览"}
          onClick={() => setPreviewOpen(true)}
        >
          🔍
        </button>
      </div>

      {previewOpen ? (
        <SdPoseOverview
          src={activeUrl}
          alt={alt}
          caption={alt}
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}
