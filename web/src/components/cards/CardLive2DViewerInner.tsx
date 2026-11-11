"use client";

import dynamic from "next/dynamic";
import { CardSdFigurePreview } from "@/components/characters/CharacterChibiAvatar";
import { Live2DPhoneFrame } from "@/components/live2d/Live2DPhoneFrame";

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
  return (
    <div className="card-character-visual">
      {live2dAssetBundleName ? (
        <Live2DPhoneFrame className="card-character-visual__live2d">
          {(zoom) => (
            <BestdoriLive2DEmbed
              assetBundleName={live2dAssetBundleName}
              mode="bestdori"
              zoom={zoom}
            />
          )}
        </Live2DPhoneFrame>
      ) : null}

      <CardSdFigurePreview
        characterId={characterId}
        sdResourceName={sdResourceName}
        alt={characterName}
        className="card-character-visual__sd"
      />
    </div>
  );
}
