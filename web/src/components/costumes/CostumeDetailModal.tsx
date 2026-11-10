"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardLive2DViewer } from "@/components/cards/CardLive2DViewer";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardRarityLabel } from "@/lib/i18n/display";
import { costumePreviewSrc } from "@/lib/recent-cards";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

export function CostumeDetailModal({
  card,
  onClose,
  themeColor = "#e9435e",
}: {
  card: CardData | null;
  onClose: () => void;
  themeColor?: string;
}) {
  const { t, locale } = useLocale();

  useEffect(() => {
    if (!card) return;
    document.body.classList.add("card-detail-open");
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("card-detail-open");
      document.body.style.overflow = prev;
    };
  }, [card]);

  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, onClose]);

  if (!card) return null;

  const preview = costumePreviewSrc(card);
  const characterId = card.character_id ?? 0;
  const characterName = card.character_name_cn || card.character_name_jp || "";
  const characterHref = characterId ? `/characters/${characterId}/` : null;

  return (
    <AnimatePresence>
      <motion.div
        key="costume-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="card-detail-backdrop costume-detail-backdrop"
        onClick={onClose}
      >
        <motion.div
          key="costume-panel"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.24 }}
          className="costume-detail-panel"
          style={{ ["--costume-accent" as string]: themeColor }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="costume-detail-close" onClick={onClose} aria-label={t("common.close")}>
            ×
          </button>

          <div className="costume-detail-grid">
            <div className="costume-detail-art">
              {preview ? (
                <AssetImage
                  src={preview}
                  alt={card.card_name}
                  fill
                  variant="full"
                  className="object-cover"
                />
              ) : null}
            </div>

            <div className="costume-detail-live2d">
              {card.live2d_asset_bundle_name && characterId ? (
                <CardLive2DViewer
                  characterId={characterId}
                  live2dAssetBundleName={card.live2d_asset_bundle_name}
                  sdResourceName={card.sd_resource_name}
                  characterName={characterName}
                  className="costume-detail-live2d__viewer"
                />
              ) : (
                <p className="costume-detail-empty">{t("costumes.noLive2d")}</p>
              )}
            </div>

            <div className="costume-detail-info">
              <p className="costume-detail-eyebrow" style={{ color: themeColor }}>
                {t("costumes.live2dBadge")}
                {card.costume_id != null ? ` · #${card.costume_id}` : ""}
              </p>
              <h3 className="costume-detail-title">{card.card_name}</h3>
              <p className="costume-detail-sub">
                {[characterName, card.band, getCardRarityLabel(card, locale)]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {card.event ? <p className="costume-detail-event">{card.event}</p> : null}

              <div className="costume-detail-actions">
                {characterHref ? (
                  <Link href={characterHref} className={cn("glass-button costume-detail-cta")}>
                    {t("costumes.viewCharacter")}
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
