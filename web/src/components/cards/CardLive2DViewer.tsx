"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const CardLive2DViewerInner = dynamic(
  () => import("@/components/cards/CardLive2DViewerInner").then((m) => m.CardLive2DViewerInner),
  { ssr: false }
);

export function CardLive2DViewer({
  characterId,
  live2dAssetBundleName,
  sdResourceName,
  characterName,
  className,
}: {
  characterId: number;
  live2dAssetBundleName?: string | null;
  sdResourceName?: string | null;
  characterName?: string;
  className?: string;
}) {
  return (
    <aside className={cn("card-detail-sidebar", className)}>
      <div className="card-detail-sidebar__scroll">
        <CardLive2DViewerInner
          characterId={characterId}
          live2dAssetBundleName={live2dAssetBundleName}
          sdResourceName={sdResourceName}
          characterName={characterName}
        />
      </div>
    </aside>
  );
}
