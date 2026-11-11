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
  /** Full head→hem strip height — taller than the phone so users can scroll. */
  contentHeight: number;
};

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

/**
 * Width-fill the Live2D character band (no side letterbox). The strip is taller
 * than the phone viewport so the scrollbar can reveal head → hem.
 */
function computeBestdoriCover(viewportW: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip More Live2D / Asset chrome; include thigh-up hem.
  const CHAR_TOP = 0.17;
  const CHAR_BOTTOM = 0.78;
  const charSpan = Math.max(0.45, CHAR_BOTTOM - CHAR_TOP);

  const safeW = Math.max(viewportW, 120);
  // Fill the frame width so the figure stays large with no black side bars.
  const scale = (safeW / contentW) * zoom * 1.03;

  const left = -SIDEBAR_WIDTH * scale + (safeW - contentW * scale) / 2;
  const top = -PAGE_HEIGHT * CHAR_TOP * scale;
  const contentHeight = Math.ceil(PAGE_HEIGHT * charSpan * scale);

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
  const [layout, setLayout] = useState<FitLayout>(() => computeBestdoriCover(280, zoom));

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
      const w = screen?.clientWidth || host.clientWidth || 280;
      if (w > 0) setLayout(computeBestdoriCover(w, zoom));
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
