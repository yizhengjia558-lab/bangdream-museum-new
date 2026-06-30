"use client";

import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

const IFRAME_WIDTH = 1280;
const IFRAME_HEIGHT = 1200;
const BASE_SCALE = 0.175;

function getLocalLive2DEmbedUrl(assetBundleName: string) {
  const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}/live2d-embed/?bundle=${encodeURIComponent(assetBundleName)}`;
}

/** Bestdori Live2D — local Pixi embed or official Bestdori viewer (cropped). */
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
  const src =
    mode === "local"
      ? getLocalLive2DEmbedUrl(assetBundleName)
      : getBestdoriLive2DViewerUrl(assetBundleName);

  const scale = BASE_SCALE * zoom;
  const cropWidth = IFRAME_WIDTH * scale;
  const cropHeight = IFRAME_HEIGHT * scale;

  return (
    <div className={cn("bestdori-live2d-embed", mode === "bestdori" && "bestdori-live2d-embed--panel", className)}>
      <div
        className="bestdori-live2d-embed__crop"
        style={{ width: cropWidth, height: cropHeight, minWidth: "100%" }}
      >
        <iframe
          src={src}
          title="Live2D"
          className={cn(
            "bestdori-live2d-embed__iframe",
            mode === "bestdori" && "bestdori-live2d-embed__iframe--bestdori"
          )}
          style={
            mode === "bestdori"
              ? {
                  width: IFRAME_WIDTH,
                  height: IFRAME_HEIGHT,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }
              : undefined
          }
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
