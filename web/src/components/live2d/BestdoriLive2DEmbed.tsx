"use client";

import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/** Bestdori Live2D viewer iframe — crop site chrome, fit canvas in phone frame. */
export function BestdoriLive2DEmbed({
  assetBundleName,
  className,
}: {
  assetBundleName: string;
  className?: string;
}) {
  return (
    <div className={cn("bestdori-live2d-embed", className)}>
      <div className="bestdori-live2d-embed__viewport">
        <iframe
          src={getBestdoriLive2DViewerUrl(assetBundleName)}
          title="Live2D"
          className="bestdori-live2d-embed__iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}
