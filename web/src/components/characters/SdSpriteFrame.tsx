"use client";

import { cn } from "@/lib/utils";

/** Bestdori livesd/sdchara.png is a 2×2 sheet (1024→4×512 cells). */
export type SdPose = "tl" | "tr" | "bl" | "br";

export const SD_POSES: SdPose[] = ["tl", "tr", "bl", "br"];

/** Default thumbnail pose — bottom-left standing/expression cell. */
export const SD_DEFAULT_POSE: SdPose = "bl";

/** Bestdori livesd/sdchara.png is a 2×2 sprite sheet. */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  onError,
  contain = false,
  pose = SD_DEFAULT_POSE,
}: {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
  /** Zoom out within cell so full character (e.g. guitar) fits in frame. */
  contain?: boolean;
  pose?: SdPose;
}) {
  return (
    <div
      className={cn(
        "sd-sprite-frame",
        `sd-sprite-frame--${pose}`,
        contain && "sd-sprite-frame--contain",
        className
      )}
      role="img"
      aria-label={alt || undefined}
      style={{ backgroundImage: `url("${src}")` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="sd-sprite-frame__probe" onError={onError} />
    </div>
  );
}
