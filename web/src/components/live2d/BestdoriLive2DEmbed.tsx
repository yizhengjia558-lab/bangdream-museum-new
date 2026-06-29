"use client";

import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/** Bestdori Live2D viewer iframe — crop site chrome, show canvas only. */
export function BestdoriLive2DEmbed({
  assetBundleName,
  className,
}: {
  assetBundleName: string;
  className?: string;
}) {
  return (
    <div className={cn("bestdori-live2d-embed", className)}>
      <iframe
        src={getBestdoriLive2DViewerUrl(assetBundleName)}
        title="Live2D"
        className="bestdori-live2d-embed__iframe"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
