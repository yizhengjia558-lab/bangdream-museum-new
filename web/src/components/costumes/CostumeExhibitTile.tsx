"use client";

import dynamic from "next/dynamic";
import type { CSSProperties } from "react";
import { CostumeLiveStillPoster } from "@/components/costumes/CostumeLiveStillPoster";
import { Live2DPhoneFrame } from "@/components/live2d/Live2DPhoneFrame";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandByFolder, getBandByName } from "@/lib/themes";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const BestdoriLive2DEmbed = dynamic(
  () => import("@/components/live2d/BestdoriLive2DEmbed").then((m) => m.BestdoriLive2DEmbed),
  { ssr: false }
);

export function costumeTileKey(card: CardData) {
  return `${card.id}-${card.costume_id ?? "x"}`;
}

function resolveBandColors(card: CardData) {
  const byFolder = card.band_folder ? getBandByFolder(card.band_folder) : undefined;
  const byName = card.band ? getBandByName(card.band) : undefined;
  const theme = byFolder ?? byName;
  return {
    primary: theme?.colors.primary ?? "#e9435e",
    secondary: theme?.colors.secondary ?? "#ff9db3",
    accent: theme?.colors.accent ?? "#ffd0dc",
    gradient: theme?.colors.gradient ?? "linear-gradient(135deg, #e9435e, #ff9db3)",
  };
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
  const bandColors = resolveBandColors(card);

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
        style={
          {
            "--costume-accent": bandColors.primary,
            "--costume-secondary": bandColors.secondary,
            "--costume-highlight": bandColors.accent,
            "--costume-gradient": bandColors.gradient,
          } as CSSProperties
        }
        role="button"
        tabIndex={0}
        onMouseEnter={onActivate}
        onMouseLeave={onDeactivate}
        onClick={(e) => {
          e.preventDefault();
          onOpenDetail();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpenDetail();
          }
        }}
        aria-label={`${card.card_name}. ${t("costumes.openCardDetail")}`}
      >
        <span className="costume-tile__badge">{t("costumes.live2dBadge")}</span>
        {liveActive ? (
          <span className="costume-tile__live-hint">{t("costumes.livePreview")}</span>
        ) : null}

        <div className="costume-tile__phone-shell">
          <Live2DPhoneFrame className="costume-tile__phone" showToolbar={false} fixedZoom={1}>
            {(zoom) => (
              <div className="costume-tile__stage">
                {bundle ? (
                  <CostumeLiveStillPoster
                    assetBundleName={bundle}
                    costumeId={card.costume_id}
                    enabled={!liveActive}
                    className={cn(liveActive && "costume-tile__still--dim")}
                  />
                ) : (
                  <div className="costume-tile__still-fallback costume-tile__still-fallback--failed" />
                )}

                {liveActive && bundle ? (
                  <div className="costume-tile__live-stage">
                    <BestdoriLive2DEmbed
                      assetBundleName={bundle}
                      mode="bestdori"
                      zoom={zoom}
                    />
                  </div>
                ) : null}

                {/* Catch clicks above the Bestdori iframe so detail always opens. */}
                <div className="costume-tile__click-catch" aria-hidden />
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
