"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

/** Bestdori livesd/sdchara.png is a 2×2 sheet (1024→4×512 cells). */
export type SdPose = "tl" | "tr" | "bl" | "br";

export const SD_POSES: SdPose[] = ["tl", "tr", "bl", "br"];

/** Default thumbnail pose — bottom-left standing/expression cell. */
export const SD_DEFAULT_POSE: SdPose = "bl";

/** Position the sheet so one cell fills the frame; origin is that cell's center. */
const POSE_STYLE: Record<
  SdPose,
  { x: string; y: string; ox: string; oy: string }
> = {
  tl: { x: "0%", y: "0%", ox: "25%", oy: "25%" },
  tr: { x: "-100%", y: "0%", ox: "75%", oy: "25%" },
  bl: { x: "0%", y: "-100%", ox: "25%", oy: "75%" },
  br: { x: "-100%", y: "-100%", ox: "75%", oy: "75%" },
};

/** Bestdori livesd/sdchara.png is a 2×2 sprite sheet. */
export function SdSpriteFrame({
  src,
  alt = "",
  className,
  onError,
  contain = false,
  pose = SD_DEFAULT_POSE,
  /** Zoom into the cell to hide neighbor-sheet bleed at the edges. */
  inset = true,
}: {
  src: string;
  alt?: string;
  className?: string;
  onError?: () => void;
  /** Extra zoom-out so wide props (e.g. guitar) fit — still keeps inset clip. */
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
        onError={onError}
      />
    </div>
  );
}
