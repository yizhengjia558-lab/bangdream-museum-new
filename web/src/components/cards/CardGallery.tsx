"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CardTile } from "@/components/cards/CardTile";
import { CardVariantBadge } from "@/components/cards/CardVariantBadge";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { expandCardDisplays, type CardDisplayItem } from "@/lib/cards";
import type { CardData } from "@/lib/data";
import { cn } from "@/lib/utils";

interface CardGalleryProps {
  cards: CardData[];
  themeColor?: string;
  visible?: number;
  onVisibleChange?: (visible: number) => void;
  highlightKey?: string | null;
}

export function CardGallery({
  cards,
  themeColor = "#e9435e",
  visible: controlledVisible,
  onVisibleChange,
  highlightKey = null,
}: CardGalleryProps) {
  const displays = expandCardDisplays(cards);
  const [internalVisible, setInternalVisible] = useState(48);
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);
  const { t } = useLocale();

  const visible = controlledVisible ?? internalVisible;
  const setVisible = onVisibleChange ?? setInternalVisible;

  const shown = displays.slice(0, visible);

  return (
    <>
      <div className="card-gallery columns-2 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5">
        {shown.map((item, i) => (
          <motion.div
            key={item.key}
            id={`card-tile-${item.key}`}
            initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ delay: (i % 12) * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "card-gallery-item break-inside-avoid scroll-mt-28",
              highlightKey === item.key && "card-gallery-item--highlight"
            )}
          >
            <CardTile onClick={() => setLightbox(item)}>
              <CardVariantBadge variant={item.variant} />

              <div className="card-image-wrap relative aspect-[3/4]">
                <AssetImage
                  src={item.src}
                  alt={item.card.card_name}
                  fill
                  className="card-image object-cover"
                />
                <div className="glass-reflection" />
              </div>

              <div className="card-caption">
                <p className="card-caption-rarity" style={{ color: themeColor }}>
                  {item.card.rarity}
                </p>
                <p className="card-caption-name mt-2 line-clamp-2">{item.card.card_name}</p>
              </div>
            </CardTile>
          </motion.div>
        ))}
      </div>

      {visible < displays.length && (
        <div className="mt-12 flex justify-center">
          <GlassButton variant="ghost" onClick={() => setVisible(visible + 48)}>
            {t("card.loadMore")}
          </GlassButton>
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
            exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
            transition={{ duration: 0.4 }}
            className="glass-dark fixed inset-0 z-[100] flex items-center justify-center p-6"
            onClick={() => setLightbox(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, filter: "blur(8px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 0.95, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              <GlassPanel className="max-h-[90vh] max-w-5xl overflow-hidden p-6 sm:p-8">
                <span
                  className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold ${
                    lightbox.variant === "trained"
                      ? "border border-white/20 bg-white/15 text-white"
                      : "border border-white/10 bg-black/30 text-white/70"
                  }`}
                >
                  {lightbox.variant === "trained" ? t("card.trained") : t("card.untrained")}
                </span>
                <AssetImage
                  src={lightbox.src}
                  alt={lightbox.card.card_name}
                  className="max-h-[70vh] w-auto rounded-2xl object-contain"
                />
                <div className="mt-6 text-center">
                  <p className="font-[family-name:var(--font-subtitle-active)] text-xl font-bold text-[var(--text-primary)]">
                    {lightbox.card.card_name}
                  </p>
                  <p className="mt-2 text-sm text-[var(--text-secondary)]">
                    {lightbox.card.rarity} · {lightbox.card.event || t("card.special")}
                  </p>
                </div>
                <button
                  className="absolute -top-2 -right-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg text-white backdrop-blur-md transition hover:bg-white/20"
                  onClick={() => setLightbox(null)}
                >
                  ×
                </button>
              </GlassPanel>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
