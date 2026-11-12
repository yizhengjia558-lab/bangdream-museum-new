"use client";

import { useEffect, useRef, useState } from "react";
import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/**
 * Bestdori Live2D tool is a responsive SPA: a short iframe crops the studio
 * mid-thigh. Use a tall iframe so the official stage can lay out the full panel.
 */
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 1680;
const SIDEBAR_WIDTH = 272;

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
 * Cover-fit the tall official Live2D studio into the phone (9:16, no letterbox).
 * One screen shows part of the panel; scroll reaches the rest of the official UI.
 */
function computeBestdoriCover(viewportW: number, viewportH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip top nav/chrome; include through the bottom of the tall studio iframe.
  const CHAR_TOP = 0.04;
  const CHAR_BOTTOM = 1;
  const fullSpan = Math.max(0.5, CHAR_BOTTOM - CHAR_TOP);

  const safeW = Math.max(viewportW, 100);
  const safeH = Math.max(viewportH, 160);

  // ~55% of the tall studio per screen → fills the phone and leaves scroll room
  // for the lower half of the official Live2D interface.
  const FIT_SPAN = 0.55;
  const scaleToFillHeight = safeH / (PAGE_HEIGHT * FIT_SPAN);
  const scaleToFillWidth = safeW / contentW;
  const scale = Math.max(scaleToFillHeight, scaleToFillWidth) * Math.max(zoom, 0.75);

  const left = -SIDEBAR_WIDTH * scale + (safeW - contentW * scale) / 2;
  const top = -PAGE_HEIGHT * CHAR_TOP * scale;
  const bandHeight = PAGE_HEIGHT * fullSpan * scale;
  const contentHeight = Math.max(Math.ceil(bandHeight), Math.ceil(safeH * (fullSpan / FIT_SPAN)));

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
