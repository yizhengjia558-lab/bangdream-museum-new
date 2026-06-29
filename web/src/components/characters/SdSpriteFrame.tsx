"use client";

import { cn } from "@/lib/utils";

/** Bestdori livesd/sdchara.png is a 2×2 sprite sheet — standing frame is bottom-left cell. */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  onError,
}: {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
}) {
  return (
    <div className={cn("sd-sprite-frame", className)} role="img" aria-label={alt || undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="sd-sprite-frame__sprite" draggable={false} onError={onError} />
    </div>
  );
}
