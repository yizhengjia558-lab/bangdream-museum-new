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
  /** Scrollable content height in CSS px (taller than the phone viewport). */
  contentHeight: number;
};

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

/**
 * Fit the Live2D character band (skip "More Live2D" / Asset chrome) so the
 * thigh-up model is mostly visible, then expose extra vertical room for pan.
 */
function computeBestdoriCover(containerW: number, containerH: number, zoom: number): FitLayout {
  const contentW = PAGE_WIDTH - SIDEBAR_WIDTH;
  // Skip Bestdori tool chrome; cover head → hem of the studio Live2D panel.
  const CHAR_TOP = 0.145;
  const CHAR_BOTTOM = 0.73;
  const charSpan = CHAR_BOTTOM - CHAR_TOP;

  // Height-fit the full character band (~90% of the phone) so head→hem shows.
  // Prefer vertical fit over width; side crop of the studio room is fine.
  const scale = ((containerH * 0.9) / (PAGE_HEIGHT * charSpan)) * zoom;

  const left = -SIDEBAR_WIDTH * scale + (containerW - contentW * scale) / 2;
  const bandHeight = PAGE_HEIGHT * charSpan * scale;
  // Extra headroom above/below so mouse-wheel / pan rail can browse.
  const scrollPad = Math.max(containerH * 0.28, bandHeight * 0.2);
  const contentHeight = bandHeight + scrollPad * 2;
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
      // Fit against the phone viewport (offsetParent / screen), not the tall scroll body.
      const viewport = el.parentElement;
      const w = viewport?.clientWidth || el.clientWidth;
      const h = viewport?.clientHeight || el.clientHeight;
      if (w > 0 && h > 0) setLayout(computeBestdoriCover(w, h, zoom));
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el.parentElement ?? el);
    return () => ro.disconnect();
  }, [mode, zoom]);

  if (mode === "local") {
    return (
      <div className={cn("bestdori-live2d-embed", "bestdori-live2d-embed--fill", className)}>
        <iframe
          src={src}
          title="Live2D"
          scrolling="no"
          className={cn("bestdori-live2d-embed__iframe", "bestdori-live2d-embed__iframe--fill")}
          style={{ overflow: "hidden" }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn("bestdori-live2d-embed", "bestdori-live2d-embed--scroll", className)}
      style={{ height: layout.contentHeight }}
    >
      <iframe
        src={src}
        title="Live2D"
        // Cross-origin page would steal wheel events; keep viewing-only so the
        // phone frame can scroll with mouse wheel / trackpad.
        scrolling="no"
        tabIndex={-1}
        className={cn("bestdori-live2d-embed__iframe", "bestdori-live2d-embed__iframe--bestdori")}
        style={{
          width: PAGE_WIDTH,
          height: PAGE_HEIGHT,
          overflow: "hidden",
          pointerEvents: "none",
          transform: `translate(${layout.left}px, ${layout.top}px) scale(${layout.scale})`,
          transformOrigin: "top left",
        }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
