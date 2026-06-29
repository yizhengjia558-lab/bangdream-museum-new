"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SdFigureImage } from "@/components/characters/SdFigureImage";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

export function CardLive2DViewerInner({
  characterId,
  live2dAssetBundleName,
  sdResourceName,
}: {
  characterId: number;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
}) {
  const [live2dFailed, setLive2dFailed] = useState(false);

  if (live2dAssetBundleName && !live2dFailed) {
    return (
      <div className="card-live2d-phone">
        <div className="card-live2d-phone__screen">
          <Live2DViewer
            assetBundleName={live2dAssetBundleName}
            className="card-live2d-stage card-live2d-stage--live2d"
            onError={() => setLive2dFailed(true)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card-live2d-phone">
      <div className="card-live2d-phone__screen card-live2d-stage card-live2d-stage--sd">
        <SdFigureImage
          characterId={characterId}
          sdResourceName={sdResourceName}
          className="card-live2d-sd"
          alt=""
        />
      </div>
    </div>
  );
}
