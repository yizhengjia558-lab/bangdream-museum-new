"use client";

import { useMemo, useState } from "react";
import { SdSpriteFrame } from "@/components/characters/SdSpriteFrame";
import { ImagePreviewOverlay } from "@/components/ui/ImagePreviewOverlay";
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

  if (hidden || urlIndex >= urls.length) return null;

  const activeUrl = urls[urlIndex];

  return (
    <>
      <div className={cn("character-chibi character-chibi--interactive", sizeClass[size], className)}>
        <SdSpriteFrame
          src={activeUrl}
          alt={alt}
          className="character-chibi__frame"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <button
          type="button"
          className="character-chibi__zoom"
          aria-label={alt ? `${alt} Q版放大` : "Q版放大"}
          onClick={() => setPreviewOpen(true)}
        >
          🔍
        </button>
      </div>

      {previewOpen ? (
        <ImagePreviewOverlay
          src={activeUrl}
          alt={alt}
          caption={alt}
          cropSprite
          onClose={() => setPreviewOpen(false)}
        />
      ) : null}
    </>
  );
}

/** 卡面详情 Q 版 standing — 默认展示，可点击放大 */
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

  if (hidden || urlIndex >= urls.length) return null;

  const activeUrl = urls[urlIndex];

  return (
    <>
      <div className={cn("card-sd-preview", className)}>
        <SdSpriteFrame
          src={activeUrl}
          alt={alt}
          className="card-sd-preview__frame"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <button
          type="button"
          className="card-sd-preview__zoom"
          aria-label={alt ? `${alt} Q版放大` : "Q版放大"}
          onClick={() => setPreviewOpen(true)}
        >
          🔍
        </button>
      </div>

      {previewOpen ? (
        <ImagePreviewOverlay
          src={activeUrl}
          alt={alt}
          caption={alt}
          cropSprite
          onClose={() => setPreviewOpen(false)}
          className="image-preview-overlay--sd"
        />
      ) : null}
    </>
  );
}
