"use client";

import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { FitText } from "@/components/ui/FitText";
import { CardTile } from "@/components/cards/CardTile";
import { CardVariantBadge } from "@/components/cards/CardVariantBadge";
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
  return (
    <motion.li
      id={`card-tile-${item.key}`}
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: (index % 12) * 0.04, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "card-gallery-item scroll-mt-28",
        highlight && "card-gallery-item--highlight"
      )}
    >
      <CardTile className="card-tile--uniform h-full" onClick={onClick}>
        <CardVariantBadge variant={item.variant} />

        <div className="card-image-wrap card-image-wrap--landscape relative aspect-[4/3]">
          <AssetImage
            src={item.src}
            alt={item.card.card_name}
            fill
            className="card-image object-cover"
          />
          <div className="glass-reflection" />
        </div>

        <div className="card-caption card-caption--uniform">
          <p className="card-caption-rarity" style={{ color: themeColor }}>
            {item.card.rarity}
          </p>
          <FitText
            text={item.card.card_name}
            className="card-caption-name"
            boxClassName="card-caption-name-box"
            minPx={9}
            maxPx={14}
            maxLines={2}
          />
        </div>
      </CardTile>
    </motion.li>
  );
}
