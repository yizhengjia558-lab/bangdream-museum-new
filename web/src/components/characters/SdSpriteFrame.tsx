"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { SD_DEFAULT_POSE, type SdPose } from "@/lib/sd-sheet";

export type { SdPose } from "@/lib/sd-sheet";
export { SD_POSES, SD_DEFAULT_POSE } from "@/lib/sd-sheet";

/** Position the sheet so one cell fills the frame; origin is that cell's center. */
const POSE_STYLE: Record<SdPose, { x: string; y: string; ox: string; oy: string }> = {
  tl: { x: "0%", y: "0%", ox: "25%", oy: "25%" },
  tr: { x: "-100%", y: "0%", ox: "75%", oy: "25%" },
  bl: { x: "0%", y: "-100%", ox: "25%", oy: "75%" },
  br: { x: "-100%", y: "-100%", ox: "75%", oy: "75%" },
};

/** Lightweight CSS crop for thumbnails — overview uses canvas extraction instead. */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  onError,
  contain = false,
  pose = SD_DEFAULT_POSE,
  inset = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
  contain?: boolean;
  pose?: SdPose;
  inset?: boolean;
}) {
  const slot = POSE_STYLE[pose];

  return (
    <div
      className={cn(
        "sd-sprite-frame",
        `sd-sprite-frame--${pose}`,
        contain && "sd-sprite-frame--contain",
        inset && "sd-sprite-frame--inset",
        className
      )}
      role="img"
      aria-label={alt || undefined}
      style={
        {
          "--sd-x": slot.x,
          "--sd-y": slot.y,
          "--sd-ox": slot.ox,
          "--sd-oy": slot.oy,
        } as CSSProperties
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        className="sd-sprite-frame__sheet"
        draggable={false}
        decoding="async"
        referrerPolicy="no-referrer"
        onError={onError}
      />
    </div>
  );
}
