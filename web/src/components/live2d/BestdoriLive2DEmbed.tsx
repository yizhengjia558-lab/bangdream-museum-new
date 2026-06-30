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
};

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

function computeBestdoriCover(containerW: number, containerH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  const baseScale = Math.max(containerW / contentW, containerH / PAGE_HEIGHT);
  const scale = baseScale * zoom;
  const scaledPageH = PAGE_HEIGHT * scale;
  const left = -SIDEBAR_WIDTH * scale + (containerW - contentW * scale) / 2;
  const top = (containerH - scaledPageH) / 2;
  return { scale, left, top };
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<FitLayout>(() => computeBestdoriCover(224, 398, zoom));

  const src =
    mode === "local"
      ? getLocalLive2DEmbedUrl(assetBundleName)
      : getBestdoriLive2DViewerUrl(assetBundleName);

  useEffect(() => {
    if (mode === "local") return;
    const el = containerRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w > 0 && h > 0) setLayout(computeBestdoriCover(w, h, zoom));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode, zoom]);

  return (
    <div
      ref={containerRef}
      className={cn("bestdori-live2d-embed", "bestdori-live2d-embed--fill", className)}
    >
      <iframe
        src={src}
        title="Live2D"
        className={cn(
          "bestdori-live2d-embed__iframe",
          mode === "local" ? "bestdori-live2d-embed__iframe--fill" : "bestdori-live2d-embed__iframe--bestdori"
        )}
        style={
          mode === "bestdori"
            ? {
                width: PAGE_WIDTH,
                height: PAGE_HEIGHT,
                transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.scale})`,
                transformOrigin: "top left",
              }
            : undefined
        }
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
