"use client";

import { AssetImage } from "@/components/ui/AssetImage";
import { CardCornerBadges } from "@/components/cards/CardCornerBadges";
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
    <li
      id={`card-tile-${item.key}`}
      className={cn(
        "card-gallery-item scroll-mt-28 card-gallery-item--static",
        highlight && "card-gallery-item--highlight",
        isKirafes && "card-gallery-item--kirafes"
      )}
      style={{ animationDelay: `${(index % 12) * 30}ms` }}
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
            variant="mobile"
            className="card-image object-cover"
          />
          <CardCornerBadges card={item.card} />
        </div>

        <div className="card-caption card-caption--uniform">
          <p className="card-caption-rarity" style={{ color: themeColor }}>
            {rarityLabel}
          </p>
          <div className="card-caption-name-box">
            <p className="fit-text card-caption-name">{item.card.card_name}</p>
          </div>
        </div>
      </CardTile>
    </li>
  );
}
