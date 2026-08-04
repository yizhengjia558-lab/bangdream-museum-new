"use client";

import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { FitText } from "@/components/ui/FitText";
import { CardFavoriteButton } from "@/components/cards/CardFavoriteButton";
import { CardTile } from "@/components/cards/CardTile";
import { CardVariantBadge } from "@/components/cards/CardVariantBadge";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardRarityLabel } from "@/lib/i18n/display";
import type { CardDisplayItem } from "@/lib/cards";
import { cn } from "@/lib/utils";

export function CardGalleryItem({
  item,
  index,
  themeColor,
  highlight,
  onClick,
}: {
  item: CardDisplayItem;
  index: number;
  themeColor: string;
  highlight: boolean;
  onClick: () => void;
}) {
  const { locale, t } = useLocale();
  const rarityLabel = getCardRarityLabel(item.card, locale);
  const isKirafes = item.card.card_kind === "kirafes";

  return (
    <motion.li
      id={`card-tile-${item.key}`}
      initial={{ opacity: 0, y: 32, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 12) * 0.04, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.985 }}
      className={cn(
        "card-gallery-item scroll-mt-28",
        highlight && "card-gallery-item--highlight",
        isKirafes && "card-gallery-item--kirafes"
      )}
    >
      <CardTile className="card-tile--uniform card-tile--interactive h-full" onClick={onClick}>
        <CardFavoriteButton displayKey={item.key} card={item.card} variant={item.variant} />
        <CardVariantBadge variant={item.variant} />
        {isKirafes ? (
          <span className="card-kirafes-badge" title={t("filter.kind.kirafes")}>
            {t("filter.kind.kirafes")}
          </span>
        ) : null}

        <div className="card-image-wrap card-image-wrap--landscape relative aspect-[4/3]">
          <AssetImage
            src={item.src}
            alt={item.card.card_name}
            fill
            variant="thumb"
            className="card-image object-cover"
          />
          <div className="glass-reflection" />
        </div>

        <div className="card-caption card-caption--uniform">
          <p className="card-caption-rarity" style={{ color: themeColor }}>
            {rarityLabel}
          </p>
          <FitText
            text={item.card.card_name}
            className="card-caption-name"
            boxClassName="card-caption-name-box"
            minPx={11}
            maxPx={17}
            maxLines={2}
          />
        </div>
      </CardTile>
    </motion.li>
  );
}
