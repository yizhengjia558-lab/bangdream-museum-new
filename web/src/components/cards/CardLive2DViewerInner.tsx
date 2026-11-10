"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { CardSdFigurePreview } from "@/components/characters/CharacterChibiAvatar";
import { Live2DPhoneFrame } from "@/components/live2d/Live2DPhoneFrame";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

const BestdoriLive2DEmbed = dynamic(
  () => import("@/components/live2d/BestdoriLive2DEmbed").then((m) => m.BestdoriLive2DEmbed),
  { ssr: false }
);

type Live2DMode = "widget" | "local" | "bestdori";

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
  const [live2dMode, setLive2dMode] = useState<Live2DMode>("widget");

  useEffect(() => {
    setLive2dMode("widget");
  }, [live2dAssetBundleName]);

  // If local iframe also fails silently, fall back to Bestdori's official viewer.
  useEffect(() => {
    if (live2dMode !== "local") return;
    const timer = window.setTimeout(() => {
      setLive2dMode((mode) => (mode === "local" ? "bestdori" : mode));
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [live2dMode, live2dAssetBundleName]);

  const handleWidgetError = useCallback(() => {
    setLive2dMode((mode) => {
      if (mode === "widget") return "local";
      if (mode === "local") return "bestdori";
      return mode;
    });
  }, []);

  return (
    <div className="card-character-visual">
      {live2dAssetBundleName ? (
        <Live2DPhoneFrame className="card-character-visual__live2d">
          {(zoom) =>
            live2dMode === "widget" ? (
              <Live2DViewer
                assetBundleName={live2dAssetBundleName}
                zoom={zoom}
                className="card-live2d-stage card-live2d-stage--live2d"
                onError={handleWidgetError}
              />
            ) : (
              <BestdoriLive2DEmbed
                assetBundleName={live2dAssetBundleName}
                mode={live2dMode === "local" ? "local" : "bestdori"}
                zoom={zoom}
                className="card-live2d-stage card-live2d-stage--live2d"
              />
            )
          }
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
