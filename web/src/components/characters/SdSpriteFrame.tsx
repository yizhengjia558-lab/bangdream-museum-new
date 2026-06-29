"use client";

import { cn } from "@/lib/utils";

/** Bestdori livesd/sdchara.png is a 2×2 sprite sheet — show the standing frame (top-left). */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  imgClassName,
  onError,
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
  onError?: () => void;
}) {
  return (
    <div className={cn("sd-sprite-frame", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn("sd-sprite-frame__img", imgClassName)}
        loading="lazy"
        decoding="async"
        onError={onError}
      />
    </div>
  );
}
