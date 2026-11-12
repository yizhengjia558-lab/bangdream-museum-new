"use client";

import dynamic from "next/dynamic";
import { CostumeLiveStillPoster } from "@/components/costumes/CostumeLiveStillPoster";
import { Live2DPhoneFrame } from "@/components/live2d/Live2DPhoneFrame";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

export function costumeTileKey(card: CardData) {
  return `${card.id}-${card.costume_id ?? "x"}`;
}

export function CostumeExhibitTile({
  card,
  index,
  liveActive,
  onActivate,
  onDeactivate,
  onOpenDetail,
}: {
  card: CardData;
  index: number;
  liveActive: boolean;
  onActivate: () => void;
  onDeactivate: () => void;
  onOpenDetail: () => void;
}) {
  const { t } = useLocale();
  const bundle = card.live2d_asset_bundle_name;
  const characterLabel = card.character_name_cn || card.character_name_jp || "";

  const openOrPreview = () => {
    // Touch: first tap activates Live2D; second tap opens card detail.
    const isCoarse =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none), (pointer: coarse)").matches;
    if (isCoarse && bundle && !liveActive) {
      onActivate();
      return;
    }
    onOpenDetail();
  };

  return (
    <li
      className={cn("costume-gallery-item", liveActive && "costume-gallery-item--live")}
      style={{ animationDelay: `${(index % 12) * 36}ms` }}
    >
      <div
        className={cn(
          "costume-tile",
          "costume-tile--exhibit",
          "costume-tile--phone",
          liveActive && "costume-tile--live"
        )}
        role="button"
        tabIndex={0}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onFocus={onActivate}
        onBlur={onDeactivate}
        onClick={openOrPreview}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openOrPreview();
          }
        }}
        aria-pressed={liveActive}
        aria-label={`${card.card_name}. ${t("costumes.openCardDetail")}`}
      >
        <span className="costume-tile__badge">{t("costumes.live2dBadge")}</span>
        {liveActive ? (
          <span className="costume-tile__live-hint">{t("costumes.livePreview")}</span>
        ) : null}

        <div className="costume-tile__phone-shell">
          <Live2DPhoneFrame className="costume-tile__phone" showToolbar={false} fixedZoom={1}>
            {() => (
              <div className="costume-tile__stage">
                {bundle ? (
                  <CostumeLiveStillPoster
                    assetBundleName={bundle}
                    enabled={!liveActive}
                    className={cn(liveActive && "costume-tile__still--dim")}
                  />
                ) : (
                  <div className="costume-tile__still-fallback costume-tile__still-fallback--failed" />
                )}

                {liveActive && bundle ? (
                  <div className="costume-tile__live-stage">
                    <Live2DViewer
                      assetBundleName={bundle}
                      motionProfile="idle"
                      className="costume-tile__live-viewer"
                    />
                  </div>
                ) : null}
              </div>
            )}
          </Live2DPhoneFrame>
        </div>

        <div className="costume-tile__meta">
          <p className="costume-tile__name">{card.card_name}</p>
          <p className="costume-tile__sub">
            {[characterLabel, card.band].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
    </li>
  );
}
