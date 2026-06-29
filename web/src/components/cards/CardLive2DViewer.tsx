"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const CardLive2DViewerInner = dynamic(
  () => import("@/components/cards/CardLive2DViewerInner").then((m) => m.CardLive2DViewerInner),
  { ssr: false }
);

export function CardLive2DViewer({
  characterId,
  costumeId,
  live2dAssetBundleName,
  sdResourceName,
  cardImageSrc,
  className,
}: {
  characterId: number;
  costumeId?: number | null;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
  cardImageSrc: string;
  className?: string;
}) {
  return (
    <div className={cn("card-live2d-viewer", className)}>
      <CardLive2DViewerInner
        characterId={characterId}
        costumeId={costumeId}
        live2dAssetBundleName={live2dAssetBundleName}
        sdResourceName={sdResourceName}
        cardImageSrc={cardImageSrc}
      />
    </div>
  );
}
