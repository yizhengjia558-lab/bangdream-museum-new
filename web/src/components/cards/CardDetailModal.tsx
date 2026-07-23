"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { CardFavoriteButton } from "@/components/cards/CardFavoriteButton";
import { CardPaletteBackground } from "@/components/cards/CardPaletteBackground";
import { CardLive2DViewer } from "@/components/cards/CardLive2DViewer";
import { KirafesDynamicStage } from "@/components/cards/KirafesDynamicStage";
import { useCardPalette } from "@/hooks/useCardPalette";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardRarityLabel } from "@/lib/i18n/display";
import type { CardData } from "@/lib/data-types";
import {
  getCardVariantAvailability,
  getCardVariantSrc,
  type CardDisplayItem,
  type CardVariant,
} from "@/lib/cards";
import { cn } from "@/lib/utils";

type KirafesPreviewMode = "static" | "dynamic";

function displayKey(cardId: string, variant: CardVariant) {
  return `${cardId}-${variant}`;
}

function CardDetailInfoChips({ card }: { card: CardData }) {
  const { t, locale } = useLocale();
  const rarityLabel = getCardRarityLabel(card, locale);
  const attribute = card.attribute
    ? t(`filter.attr.${card.attribute}` as "filter.attr.power")
    : null;
  const kind =
    card.card_kind && card.card_kind !== "normal"
      ? t(`filter.kind.${card.card_kind}` as "filter.kind.limited")
      : null;
  const releaseYear =
    card.release_year ?? (card.release_date ? parseInt(card.release_date.slice(0, 4), 10) : null);

  const chips = [
    { label: rarityLabel, accent: true },
    attribute ? { label: attribute } : null,
    kind ? { label: kind } : null,
    releaseYear ? { label: String(releaseYear) } : null,
  ].filter(Boolean) as { label: string; accent?: boolean }[];

  if (!chips.length) return null;

  return (
    <div className="card-detail-info-chips">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={cn("card-detail-info-chip", chip.accent && "card-detail-info-chip--accent")}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

function isTypingTarget(target: EventTarget | null) {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

function CardDetailNavButton({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      className={cn("card-detail-nav-btn", direction === "prev" ? "card-detail-nav-btn--prev" : "card-detail-nav-btn--next")}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
    >
      <span aria-hidden>{direction === "prev" ? "‹" : "›"}</span>
    </button>
  );
}

export function CardDetailModal({
  item,
  items = [],
  onSelectItem,
  onClose,
  themeColor = "#e9435e",
}: {
  item: CardDisplayItem | null;
  items?: CardDisplayItem[];
  onSelectItem?: (item: CardDisplayItem) => void;
  onClose: () => void;
  themeColor?: string;
}) {
  const { t } = useLocale();
  const [variant, setVariant] = useState<CardVariant>("untrained");
  const [fullscreen, setFullscreen] = useState(false);
  const [kirafesMode, setKirafesMode] = useState<KirafesPreviewMode>("dynamic");

  const availability = useMemo(
    () => (item ? getCardVariantAvailability(item.card) : { untrained: false, trained: false, both: false }),
    [item]
  );

  const isKirafes = item?.card.card_kind === "kirafes";
  const showKirafesDynamic = Boolean(isKirafes && kirafesMode === "dynamic");

  const activeSrc = item ? getCardVariantSrc(item.card, variant) : "";
  const activeKey = item ? displayKey(item.card.id, variant) : "";
  const characterId = item?.card.character_id ?? 0;
  const palette = useCardPalette(activeSrc, themeColor);

  useEffect(() => {
    if (!item) return;
    if (availability.both) setVariant(item.variant);
    else if (availability.trained) setVariant("trained");
    else setVariant("untrained");
    setKirafesMode(item.card.card_kind === "kirafes" ? "dynamic" : "static");
    setFullscreen(false);
  }, [item, availability.both, availability.trained, availability.untrained]);

  const navIndex = useMemo(
    () => (item && items.length ? items.findIndex((entry) => entry.key === item.key) : -1),
    [item, items]
  );
  const canNavigate = items.length > 1 && navIndex >= 0 && Boolean(onSelectItem);
  const canGoPrev = canNavigate && navIndex > 0;
  const canGoNext = canNavigate && navIndex < items.length - 1;

  const goPrev = () => {
    if (canGoPrev && onSelectItem) onSelectItem(items[navIndex - 1]);
  };

  const goNext = () => {
    if (canGoNext && onSelectItem) onSelectItem(items[navIndex + 1]);
  };

  useEffect(() => {
    if (!item) return;
    document.body.classList.add("card-detail-open");
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("card-detail-open");
      document.body.style.overflow = prevOverflow;
    };
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;

      if (e.key === "Escape") {
        if (fullscreen) setFullscreen(false);
        else onClose();
        return;
      }

      if (!canNavigate || !onSelectItem) return;

      if (e.key === "ArrowLeft" && navIndex > 0) {
        e.preventDefault();
        onSelectItem(items[navIndex - 1]);
        return;
      }

      if (e.key === "ArrowRight" && navIndex < items.length - 1) {
        e.preventDefault();
        onSelectItem(items[navIndex + 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, fullscreen, onClose, canNavigate, navIndex, items, onSelectItem]);

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
            {canNavigate ? (
              <>
                <CardDetailNavButton direction="prev" disabled={!canGoPrev} onClick={goPrev} label={t("card.prevCard")} />
                <CardDetailNavButton direction="next" disabled={!canGoNext} onClick={goNext} label={t("card.nextCard")} />
              </>
            ) : null}
            <CardPaletteBackground gradient={palette.gradient} className="card-palette-bg--modal" />
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={cn("card-detail-panel-wrap", "card-detail-panel")}
              style={{ "--card-accent": themeColor } as CSSProperties}
              onClick={(e) => e.stopPropagation()}
            >
              <button type="button" className="card-detail-close" onClick={onClose} aria-label={t("common.close")}>
                ×
              </button>

              <div className="card-detail-header">
                <CardFavoriteButton displayKey={activeKey} className="card-detail-favorite" />
                {canNavigate ? (
                  <p className="card-detail-nav-position">
                    {t("card.navPosition")
                      .replace("{current}", String(navIndex + 1))
                      .replace("{total}", String(items.length))}
                  </p>
                ) : null}
              </div>

              <div className="card-detail-visual-row">
                <div className="card-detail-main">
                  <div className="card-detail-image-stack">
                    {showKirafesDynamic ? (
                      <KirafesDynamicStage
                        cardSrc={activeSrc}
                        cardName={item.card.card_name}
                        videoSrc={item.card.kirafes_video}
                        bilibiliBvid={item.card.bilibili_bvid}
                      />
                    ) : (
                      <button
                        type="button"
                        className="card-detail-image-btn"
                        onClick={() => setFullscreen(true)}
                        aria-label={t("card.fullscreenPreview")}
                      >
                        <div className="card-detail-image-frame">
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={`${item.key}-${variant}`}
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
                    )}
                  </div>

                  <div className="card-detail-controls">
                    {isKirafes ? (
                      <div className="card-detail-toggle-wrap card-detail-toggle-wrap--below">
                        <div className="card-detail-toggle" role="tablist" aria-label={t("card.kirafesPreviewMode")}>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={kirafesMode === "static" ? "true" : "false"}
                            className={cn(
                              "card-detail-toggle-btn",
                              kirafesMode === "static" && "card-detail-toggle-btn--active"
                            )}
                            onClick={() => setKirafesMode("static")}
                          >
                            {t("card.staticArt")}
                          </button>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={kirafesMode === "dynamic" ? "true" : "false"}
                            className={cn(
                              "card-detail-toggle-btn",
                              kirafesMode === "dynamic" && "card-detail-toggle-btn--active"
                            )}
                            onClick={() => setKirafesMode("dynamic")}
                          >
                            {t("card.dynamicArt")}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    {showToggle ? (
                      <div className="card-detail-toggle-wrap card-detail-toggle-wrap--below">
                        <div className="card-detail-toggle" role="tablist" aria-label={t("card.viewMode")}>
                          <button
                            type="button"
                            role="tab"
                            aria-selected={variant === "untrained" ? "true" : "false"}
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
                            aria-selected={variant === "trained" ? "true" : "false"}
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
                    ) : null}

                    <div className="card-detail-meta card-detail-meta--inline">
                      <p className="card-detail-name">{item.card.card_name}</p>
                      <p className="card-detail-sub">{item.card.event || t("card.special")}</p>
                      <CardDetailInfoChips card={item.card} />
                    </div>

                    <button type="button" className="card-detail-fullscreen-btn" onClick={() => setFullscreen(true)}>
                      {t("card.fullscreenPreview")} <span aria-hidden>🔍</span>
                    </button>
                  </div>
                </div>

                {characterId > 0 ? (
                  <CardLive2DViewer
                    characterId={characterId}
                    live2dAssetBundleName={item.card.live2d_asset_bundle_name}
                    sdResourceName={item.card.sd_resource_name}
                    characterName={item.card.card_name}
                    className="card-detail-sidebar"
                  />
                ) : null}
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
            {canNavigate ? (
              <>
                <CardDetailNavButton direction="prev" disabled={!canGoPrev} onClick={goPrev} label={t("card.prevCard")} />
                <CardDetailNavButton direction="next" disabled={!canGoNext} onClick={goNext} label={t("card.nextCard")} />
              </>
            ) : null}
            <CardPaletteBackground gradient={palette.gradient} className="card-palette-bg--fullscreen" />
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
              onClick={(e) => e.stopPropagation()}
            >
              {showKirafesDynamic ? (
                <div className="card-detail-fullscreen-dynamic">
                  <KirafesDynamicStage
                    cardSrc={activeSrc}
                    cardName={item.card.card_name}
                    videoSrc={item.card.kirafes_video}
                    bilibiliBvid={item.card.bilibili_bvid}
                  />
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${item.key}-${variant}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.38 }}
                    className="card-detail-fullscreen-image-wrap"
                    onClick={() => setFullscreen(false)}
                  >
                    <AssetImage
                      src={activeSrc}
                      alt={item.card.card_name}
                      className="card-detail-fullscreen-image max-h-[92vh] w-auto max-w-[min(96vw,1200px)] object-contain"
                    />
                  </motion.div>
                </AnimatePresence>
              )}
              <p className="card-detail-fullscreen-caption">
                {isKirafes && showKirafesDynamic
                  ? t("card.dynamicArt")
                  : variant === "trained"
                    ? t("card.afterTraining")
                    : t("card.beforeTraining")}{" "}
                · {item.card.card_name}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
