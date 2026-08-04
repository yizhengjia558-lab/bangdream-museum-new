"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchCharacterTopCards, isCommunityEnabled } from "@/lib/community-api";
import { getCardVariantSrc } from "@/lib/cards";
import type { CardData } from "@/lib/data-types";

export function CharacterHotCards({
  characterId,
  cards,
  accent = "#e9435e",
  onJump,
}: {
  characterId: number;
  cards: CardData[];
  accent?: string;
  onJump?: (cardId: string) => void;
}) {
  const { t } = useLocale();
  const [entries, setEntries] = useState<{ card: CardData; views: number }[]>([]);
  const [loaded, setLoaded] = useState(false);

  const cardMap = useMemo(() => new Map(cards.map((c) => [c.id, c])), [cards]);

  useEffect(() => {
    if (!isCommunityEnabled()) {
      setLoaded(true);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetchCharacterTopCards(characterId, { limit: 3 });
        if (cancelled) return;
        const resolved = res.cards
          .map((e) => {
            const card = cardMap.get(e.cardId);
            return card ? { card, views: e.views } : null;
          })
          .filter(Boolean) as { card: CardData; views: number }[];
        setEntries(resolved);
      } catch {
        if (!cancelled) setEntries([]);
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [characterId, cardMap]);

  if (!loaded || entries.length === 0) return null;

  return (
    <div className="character-hot-cards">
      <div className="character-hot-cards-head">
        <h3 className="character-hot-cards-title" style={{ color: accent }}>
          {t("hotCards.title")}
        </h3>
        <p className="character-hot-cards-sub">{t("hotCards.subtitle")}</p>
      </div>
      <ol className="character-hot-cards-grid">
        {entries.map((entry, i) => {
          const src =
            getCardVariantSrc(entry.card, "trained") ||
            getCardVariantSrc(entry.card, "untrained");
          return (
            <li key={entry.card.id}>
              <button
                type="button"
                className="character-hot-card"
                onClick={() => onJump?.(entry.card.id)}
              >
                <span className="character-hot-rank" style={{ background: accent }}>
                  {i + 1}
                </span>
                <div className="character-hot-thumb">
                  {src ? (
                    <AssetImage
                      src={src}
                      alt={entry.card.card_name}
                      fill
                      variant="thumb"
                      className="object-cover object-top"
                    />
                  ) : null}
                </div>
                <div className="character-hot-meta">
                  <p className="character-hot-name">{entry.card.card_name}</p>
                  <p className="character-hot-views">
                    {t("hotCards.views").replace("{count}", entry.views.toLocaleString())}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
