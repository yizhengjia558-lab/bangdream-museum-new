"use client";

import { useEffect, useRef, useState } from "react";
import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/** Bestdori Live2D tool page layout (approximate). */
const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 960;
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
 * Fit Bestdori Live2D head→hem into a normal phone frame.
 * Hem is pinned to the bottom (no floating). At 100% the full figure fits;
 * zooming in grows a scrollable strip so you can pan.
 */
function computeBestdoriCover(viewportW: number, viewportH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip More Live2D / Asset chrome; cover studio panel to visual hem.
  const CHAR_TOP = 0.18;
  const CHAR_BOTTOM = 0.7;
  const charSpan = Math.max(0.4, CHAR_BOTTOM - CHAR_TOP);

  const safeW = Math.max(viewportW, 120);
  const safeH = Math.max(viewportH, 180);

  // Fit the whole character band into the phone (contain) so the figure is complete.
  const scaleH = (safeH * 0.98) / (PAGE_HEIGHT * charSpan);
  const scaleW = (safeW * 1.02) / contentW;
  const baseScale = Math.min(scaleH, scaleW);
  const scale = baseScale * zoom;

  const left = -SIDEBAR_WIDTH * scale + (safeW - contentW * scale) / 2;

  // Pin hem to the bottom of the visible phone — avoids “悬空”.
  if (zoom <= 1.01) {
    const top = safeH - PAGE_HEIGHT * CHAR_BOTTOM * scale;
    return { scale, left, top, contentHeight: safeH };
  }

  // Zoomed: make a tall scroll strip of the full band so users can pan head↔hem.
  const bandHeight = PAGE_HEIGHT * charSpan * scale;
  const contentHeight = Math.ceil(Math.max(bandHeight, safeH * zoom));
  const top = -PAGE_HEIGHT * CHAR_TOP * scale;
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

  const zoomed = zoom > 1.01;

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
        zoomed ? "bestdori-live2d-embed--scroll" : "bestdori-live2d-embed--fill",
        "card-live2d-stage",
        "card-live2d-stage--live2d",
        className
      )}
      style={zoomed ? { height: `${layout.contentHeight}px` } : undefined}
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
