"use client";

import { cn } from "@/lib/utils";

/** Bestdori livesd/sdchara.png is a 2×2 sprite sheet — standing frame is bottom-left cell. */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  onError,
  contain = false,
}: {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
  /** Zoom out within cell so full character (e.g. guitar) fits in frame. */
  contain?: boolean;
}) {
  return (
    <div
      className={cn("sd-sprite-frame", contain && "sd-sprite-frame--contain", className)}
      role="img"
      aria-label={alt || undefined}
      style={{ backgroundImage: `url("${src}")` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="sd-sprite-frame__probe" onError={onError} />
    </div>
  );
}
