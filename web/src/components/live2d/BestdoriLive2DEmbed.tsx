"use client";

import { useEffect, useRef, useState } from "react";
import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/**
 * Normal Bestdori layout width; tall height so the Live2D stage can show a
 * full thigh-up figure. We scale the *character stage* (not “shrink the site”).
 */
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 1600;
const SIDEBAR_WIDTH = 272;
/** Live2D character panel width as a fraction of the phone — keeps the figure smaller. */
const CHARACTER_STAGE_WIDTH = 0.75;

type FitLayout = {
  scale: number;
  left: number;
  top: number;
  contentHeight: number;
};

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

/**
 * Shrink the Live2D character display to ~75% of the phone width (figure looks
 * smaller), keep the stage horizontally complete, and use a tall strip so the
 * side scrollbar can pan head → hem.
 */
function computeBestdoriCover(viewportW: number, viewportH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip top chrome; keep the Live2D stage through the hem.
  const CHAR_TOP = 0.14;
  const CHAR_BOTTOM = 0.96;
  const fullSpan = Math.max(0.5, CHAR_BOTTOM - CHAR_TOP);

  const safeW = Math.max(viewportW, 100);
  const safeH = Math.max(viewportH, 160);

  // Character stage = 75% of phone width (not a whole-page “website shrink”).
  const scale =
    ((safeW * CHARACTER_STAGE_WIDTH) / contentW) * Math.max(zoom, 0.75);

  const left = -SIDEBAR_WIDTH * scale + (safeW - contentW * scale) / 2;
  const top = -PAGE_HEIGHT * CHAR_TOP * scale;
  const bandHeight = PAGE_HEIGHT * fullSpan * scale;
  const contentHeight = Math.max(Math.ceil(bandHeight), Math.ceil(safeH * 2.2));

  return { scale, left, top, contentHeight };
}

/** Bestdori Live2D — local Pixi embed or official Bestdori viewer (cover-fit). */
export function BestdoriLive2DEmbed({
  assetBundleName,
  className,
  mode = "bestdori",
  zoom = 1,
}: {
  assetBundleName: string;
  className?: string;
  /** `local` = same-origin Pixi page; `bestdori` = official tool viewer (cropped). */
  mode?: "local" | "bestdori";
  zoom?: number;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<FitLayout>(() => computeBestdoriCover(220, 390, zoom));

  const src =
    mode === "local"
      ? getLocalLive2DEmbedUrl(assetBundleName)
      : getBestdoriLive2DViewerUrl(assetBundleName);

  useEffect(() => {
    if (mode === "local") return;
    const host = hostRef.current;
    if (!host) return;

    const update = () => {
      const screen = host.closest(".card-live2d-phone__screen") as HTMLElement | null;
      const w = screen?.clientWidth || host.clientWidth || 220;
      const h = screen?.clientHeight || 390;
      if (w > 0 && h > 0) setLayout(computeBestdoriCover(w, h, zoom));
    };

    update();
    const ro = new ResizeObserver(update);
    const screen = host.closest(".card-live2d-phone__screen");
    if (screen) ro.observe(screen);
    else ro.observe(host);
    return () => ro.disconnect();
  }, [mode, zoom, assetBundleName]);

  if (mode === "local") {
    return (
      <div className={cn("bestdori-live2d-embed", "bestdori-live2d-embed--fill", className)}>
        <iframe
          src={src}
          title="Live2D"
          scrolling="no"
          className={cn("bestdori-live2d-embed__iframe", "bestdori-live2d-embed__iframe--fill")}
          style={{ overflow: "hidden" }}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div
      ref={hostRef}
      className={cn(
        "bestdori-live2d-embed",
        "bestdori-live2d-embed--scroll",
        "card-live2d-stage",
        "card-live2d-stage--live2d",
        className
      )}
      style={{ height: `${layout.contentHeight}px` }}
    >
      <iframe
        key={assetBundleName}
        src={src}
        title="Live2D"
        scrolling="no"
        className={cn("bestdori-live2d-embed__iframe", "bestdori-live2d-embed__iframe--bestdori")}
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          overflow: "hidden",
          pointerEvents: "auto",
          transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.scale})`,
          transformOrigin: "top left",
        }}
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
        allow="autoplay; fullscreen"
      />
    </div>
  );
}
