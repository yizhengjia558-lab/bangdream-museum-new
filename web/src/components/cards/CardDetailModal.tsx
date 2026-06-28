"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardFavoriteButton } from "@/components/cards/CardFavoriteButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  getCardVariantAvailability,
  getCardVariantSrc,
  type CardDisplayItem,
  type CardVariant,
} from "@/lib/cards";
import { cn } from "@/lib/utils";

function displayKey(cardId: string, variant: CardVariant) {
  return `${cardId}-${variant}`;
}

export function CardDetailModal({
  item,
  onClose,
  themeColor = "#e9435e",
}: {
  item: CardDisplayItem | null;
  onClose: () => void;
  themeColor?: string;
}) {
  const { t } = useLocale();
  const [variant, setVariant] = useState<CardVariant>("untrained");
  const [fullscreen, setFullscreen] = useState(false);

  const availability = useMemo(
    () => (item ? getCardVariantAvailability(item.card) : { untrained: false, trained: false, both: false }),
    [item]
  );

  const activeSrc = item ? getCardVariantSrc(item.card, variant) : "";
  const activeKey = item ? displayKey(item.card.id, variant) : "";

  useEffect(() => {
    if (!item) return;
    setVariant(item.variant);
    setFullscreen(false);
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, fullscreen, onClose]);

  if (!item || !activeSrc) return null;

  const showToggle = availability.both;

  return (
    <>
      <AnimatePresence>
        {item && !fullscreen && (
          <motion.div
            key="card-detail-backdrop"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(14px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.38 }}
            className="card-detail-backdrop"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="card-detail-panel"
              style={{ "--card-accent": themeColor } as CSSProperties}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="card-detail-close" onClick={onClose} aria-label={t("common.close")}>
                ×
              </button>

              <div className="card-detail-header">
                <CardFavoriteButton displayKey={activeKey} className="card-detail-favorite" />
              </div>

              <button
                type="button"
                className="card-detail-image-btn"
                onClick={() => setFullscreen(true)}
                aria-label={t("card.fullscreenPreview")}
              >
                <div className="card-detail-image-frame">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={variant}
                      initial={{ opacity: 0, scale: 1.02 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                      className="card-detail-image-layer"
                    >
                      <AssetImage
                        src={activeSrc}
                        alt={item.card.card_name}
                        fill
                        className="card-detail-image object-contain"
                      />
                    </motion.div>
                  </AnimatePresence>
                  <div className="card-detail-image-glow" aria-hidden />
                </div>
              </button>

              {showToggle && (
                <div className="card-detail-toggle-wrap">
                  <p className="card-detail-toggle-label">{t("card.viewMode")}</p>
                  <div className="card-detail-toggle" role="tablist" aria-label={t("card.viewMode")}>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={variant === "untrained"}
                      disabled={!availability.untrained}
                      className={cn(
                        "card-detail-toggle-btn",
                        variant === "untrained" && "card-detail-toggle-btn--active"
                      )}
                      onClick={() => setVariant("untrained")}
                    >
                      {t("card.beforeTraining")}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={variant === "trained"}
                      disabled={!availability.trained}
                      className={cn(
                        "card-detail-toggle-btn",
                        variant === "trained" && "card-detail-toggle-btn--active"
                      )}
                      onClick={() => setVariant("trained")}
                    >
                      {t("card.afterTraining")}
                    </button>
                  </div>
                </div>
              )}

              <button type="button" className="card-detail-fullscreen-btn" onClick={() => setFullscreen(true)}>
                {t("card.fullscreenPreview")} <span aria-hidden>🔍</span>
              </button>

              <div className="card-detail-meta">
                <p className="card-detail-name">{item.card.card_name}</p>
                <p className="card-detail-sub">
                  {item.card.rarity} · {item.card.event || t("card.special")}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {item && fullscreen && (
          <motion.div
            key="card-detail-fullscreen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="card-detail-fullscreen"
            onClick={() => setFullscreen(false)}
          >
            <button
              type="button"
              className="card-detail-fullscreen-close"
              onClick={() => setFullscreen(false)}
              aria-label={t("common.close")}
            >
              ×
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="card-detail-fullscreen-inner"
              onClick={() => setFullscreen(false)}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={variant}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.38 }}
                  className="card-detail-fullscreen-image-wrap"
                >
                  <AssetImage
                    src={activeSrc}
                    alt={item.card.card_name}
                    className="card-detail-fullscreen-image max-h-[92vh] w-auto max-w-[min(96vw,1200px)] object-contain"
                  />
                </motion.div>
              </AnimatePresence>
              <p className="card-detail-fullscreen-caption">
                {variant === "trained" ? t("card.afterTraining") : t("card.beforeTraining")} · {item.card.card_name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
