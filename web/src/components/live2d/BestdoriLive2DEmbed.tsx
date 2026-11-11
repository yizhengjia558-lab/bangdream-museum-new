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
 * Crop Bestdori's tool page to the Live2D studio panel (skip chrome) and fit
 * head→hem into the phone. Content is taller than the viewport so the scrollbar
 * can reveal the rest of the frame.
 */
function computeBestdoriCover(viewportW: number, viewportH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip More Live2D / Asset title; include thigh-up hem + a little floor.
  const CHAR_TOP = 0.17;
  const CHAR_BOTTOM = 0.84;
  const charSpan = Math.max(0.45, CHAR_BOTTOM - CHAR_TOP);

  const safeW = Math.max(viewportW, 120);
  const safeH = Math.max(viewportH, 160);

  // Fit the whole character band into the phone height so hem is on-screen at 100%.
  const scaleH = (safeH * 0.94) / (PAGE_HEIGHT * charSpan);
  const scaleW = (safeW * 1.08) / contentW;
  const scale = Math.min(scaleH, scaleW * 1.2) * zoom;

  const left = -SIDEBAR_WIDTH * scale + (safeW - contentW * scale) / 2;
  const bandHeight = PAGE_HEIGHT * charSpan * scale;
  // Enough scroll room to move past header chrome / lower floor when zoomed.
  const scrollPad = Math.max(safeH * 0.45, bandHeight * 0.35);
  const contentHeight = Math.ceil(bandHeight + scrollPad * 2);
  const top = scrollPad - PAGE_HEIGHT * CHAR_TOP * scale;

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
  const [layout, setLayout] = useState<FitLayout>(() => computeBestdoriCover(224, 398, zoom));

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
      const w = screen?.clientWidth || host.clientWidth || 224;
      const h = screen?.clientHeight || 398;
      if (w > 0 && h > 0) setLayout(computeBestdoriCover(w, h, zoom));
    };

    update();
    // Start near the character (below the upper scroll pad).
    requestAnimationFrame(() => {
      const screen = host.closest(".card-live2d-phone__screen") as HTMLElement | null;
      if (!screen) return;
      const pad = Math.max(screen.clientHeight * 0.45, 48);
      screen.scrollTop = Math.max(0, pad * 0.55);
    });

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
      className={cn("bestdori-live2d-embed", "bestdori-live2d-embed--scroll", className)}
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
          // Keep Live2D click / drag interactivity from Bestdori's viewer.
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
