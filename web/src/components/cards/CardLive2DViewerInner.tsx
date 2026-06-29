"use client";

import { SdFigureImage } from "@/components/characters/SdFigureImage";
import { getBestdoriLive2DViewerUrl } from "@/lib/bestdori-assets";

export function CardLive2DViewerInner({
  characterId,
  live2dAssetBundleName,
  sdResourceName,
}: {
  characterId: number;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
}) {
  if (live2dAssetBundleName) {
    return (
      <div className="card-live2d-stage card-live2d-stage--live2d">
        <iframe
          src={getBestdoriLive2DViewerUrl(live2dAssetBundleName)}
          title="Live2D"
          className="card-live2d-iframe"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return (
    <div className="card-live2d-stage card-live2d-stage--sd">
      <SdFigureImage
        characterId={characterId}
        sdResourceName={sdResourceName}
        className="card-live2d-sd"
        alt=""
      />
    </div>
  );
}
