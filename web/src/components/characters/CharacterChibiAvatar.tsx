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

/** 成员页校服 Q 版 — 可点击放大预览 */
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
      <button
        type="button"
        className={cn("character-chibi character-chibi--interactive", sizeClass[size], className)}
        aria-label={alt ? `${alt} Q版预览` : "Q版预览"}
        onClick={() => setPreviewOpen(true)}
      >
        <SdSpriteFrame
          src={activeUrl}
          alt=""
          className="character-chibi__frame"
          imgClassName="character-chibi__img"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <span className="character-chibi__zoom" aria-hidden>
          🔍
        </span>
      </button>

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

/** 卡面详情 Q 版 standing — 可点击放大预览 */
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
      <button
        type="button"
        className={cn("card-sd-preview", className)}
        aria-label={alt ? `${alt} Q版预览` : "Q版预览"}
        onClick={() => setPreviewOpen(true)}
      >
        <SdSpriteFrame
          src={activeUrl}
          alt=""
          className="card-sd-preview__frame"
          imgClassName="card-sd-preview__img"
          onError={() => {
            if (urlIndex + 1 < urls.length) setUrlIndex((i) => i + 1);
            else setHidden(true);
          }}
        />
        <span className="card-sd-preview__zoom" aria-hidden>
          🔍
        </span>
      </button>

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
