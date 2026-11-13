"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { getCardAttrColor, getCardStarCount } from "@/lib/card-attrs";
import type { CardData } from "@/lib/data-types";
import { cn } from "@/lib/utils";

export function CardCornerBadges({
  card,
  className,
  compact = false,
}: {
  card: CardData;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const stars = getCardStarCount(card);
  const attrColor = getCardAttrColor(card.attribute);
  const kind =
    card.card_kind && card.card_kind !== "normal"
      ? t(`filter.kind.${card.card_kind}` as "filter.kind.limited")
      : null;

  if (!stars && !attrColor && !kind) return null;

  return (
    <div className={cn("card-corner-badges", compact && "card-corner-badges--compact", className)} aria-hidden>
      {attrColor ? (
        <span className="card-corner-badges__attr" style={{ background: attrColor }} title={card.attribute || ""} />
      ) : null}
      {stars > 0 ? (
        <span className="card-corner-badges__stars">
          {Array.from({ length: stars }, (_, i) => (
            <i key={i} />
          ))}
        </span>
      ) : null}
      {kind ? <span className="card-corner-badges__kind">{kind}</span> : null}
    </div>
  );
}
