"use client";

import dynamic from "next/dynamic";
import { AssetImage } from "@/components/ui/AssetImage";
import { cn } from "@/lib/utils";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

/**
 * KiraFes (动态卡) main-stage preview:
 * animated card art backdrop + Live2D costume when available.
 */
export function KirafesDynamicStage({
  cardSrc,
  cardName,
  live2dAssetBundleName,
  className,
  onOpenFullscreen,
}: {
  cardSrc: string;
  cardName: string;
  live2dAssetBundleName?: string | null;
  className?: string;
  onOpenFullscreen?: () => void;
}) {
  const hasLive2d = Boolean(live2dAssetBundleName);

  return (
    <div className={cn("kirafes-dynamic-stage", className)}>
      <div className="kirafes-dynamic-stage__backdrop" aria-hidden>
        <div className="kirafes-dynamic-stage__kenburns">
          <AssetImage src={cardSrc} alt="" fill className="object-cover" />
        </div>
        <div className="kirafes-dynamic-stage__scrim" />
      </div>

      <div className="kirafes-dynamic-stage__sparkles" aria-hidden>
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>

      {hasLive2d ? (
        <div className="kirafes-dynamic-stage__live2d">
          <Live2DViewer
            assetBundleName={live2dAssetBundleName!}
            className="kirafes-dynamic-stage__live2d-viewer"
            motionProfile="showcase"
          />
        </div>
      ) : (
        <button
          type="button"
          className="kirafes-dynamic-stage__art-btn"
          onClick={onOpenFullscreen}
          aria-label={cardName}
        >
          <div className="kirafes-dynamic-stage__art-frame">
            <div className="kirafes-dynamic-stage__kenburns kirafes-dynamic-stage__kenburns--hero">
              <AssetImage src={cardSrc} alt={cardName} fill className="object-contain" />
            </div>
            <div className="kirafes-dynamic-stage__sheen" aria-hidden />
          </div>
        </button>
      )}

      <div className="kirafes-dynamic-stage__badge" aria-hidden>
        LIVE
      </div>
    </div>
  );
}
