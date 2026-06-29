"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CardSdFigurePreview } from "@/components/characters/CharacterChibiAvatar";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

const BestdoriLive2DEmbed = dynamic(
  () => import("@/components/live2d/BestdoriLive2DEmbed").then((m) => m.BestdoriLive2DEmbed),
  { ssr: false }
);

export function CardLive2DViewerInner({
  characterId,
  live2dAssetBundleName,
  sdResourceName,
  characterName = "",
}: {
  characterId: number;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
  characterName?: string;
}) {
  const [live2dFailed, setLive2dFailed] = useState(false);
  const showWidget = Boolean(live2dAssetBundleName) && !live2dFailed;

  return (
    <div className="card-character-visual">
      <CardSdFigurePreview
        characterId={characterId}
        sdResourceName={sdResourceName}
        alt={characterName}
        className="card-character-visual__sd"
      />

      {live2dAssetBundleName ? (
        <div className="card-live2d-phone card-character-visual__live2d">
          <div className="card-live2d-phone__screen">
            {showWidget ? (
              <Live2DViewer
                assetBundleName={live2dAssetBundleName}
                className="card-live2d-stage card-live2d-stage--live2d"
                onError={() => setLive2dFailed(true)}
              />
            ) : (
              <BestdoriLive2DEmbed
                assetBundleName={live2dAssetBundleName}
                className="card-live2d-stage card-live2d-stage--live2d"
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
