"use client";

import { useEffect, useMemo, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { CardFilterBar } from "@/components/cards/CardFilterBar";
import { CardGalleryItem } from "@/components/cards/CardGalleryItem";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { EMPTY_CARD_FILTERS, filterCards, type CardFilterState } from "@/lib/card-filters";
import { buildMemberMap, filterCardsBySearch } from "@/lib/card-search";
import { expandCardDisplays, type CardDisplayItem } from "@/lib/cards";
import { getAllCharacters, type CardData, type CharacterData } from "@/lib/data";

interface CardGalleryProps {
  cards: CardData[];
  themeColor?: string;
  visible?: number;
  onVisibleChange?: (visible: number) => void;
  highlightKey?: string | null;
  members?: CharacterData[];
  showFilters?: boolean;
}

export function CardGallery({
  cards,
  themeColor = "#e9435e",
  visible: controlledVisible,
  onVisibleChange,
  highlightKey = null,
  members = [],
  showFilters = true,
}: CardGalleryProps) {
  const { t } = useLocale();
  const { query, hasQuery } = useGlobalSearch();
  const [filters, setFilters] = useState<CardFilterState>(EMPTY_CARD_FILTERS);
  const [internalVisible, setInternalVisible] = useState(48);
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);

  const visible = controlledVisible ?? internalVisible;
  const setVisible = onVisibleChange ?? setInternalVisible;

  const memberMap = useMemo(
    () => buildMemberMap(members.length > 0 ? members : getAllCharacters()),
    [members]
  );

  const filteredCards = useMemo(() => {
    const facetFiltered = filterCards(cards, filters);
    return filterCardsBySearch(facetFiltered, query, memberMap);
  }, [cards, filters, query, memberMap]);
  const displays = useMemo(() => expandCardDisplays(filteredCards), [filteredCards]);

  useEffect(() => {
    setVisible(48);
  }, [filters, query, setVisible]);

  const shown = displays.slice(0, visible);

  return (
    <>
      {showFilters && (
        <CardFilterBar
          cards={cards}
          filters={filters}
          onChange={setFilters}
          members={members}
          themeColor={themeColor}
          resultCount={filteredCards.length}
          totalCount={cards.length}
        />
      )}

      {displays.length === 0 ? (
        <GlassPanel className="card-filter-empty p-10 text-center">
          <p className="text-[var(--text-secondary)]">
            {hasQuery ? t("search.noResults") : t("filter.noResults")}
          </p>
        </GlassPanel>
      ) : (
        <ul className="card-gallery-grid">
          {shown.map((item, i) => (
            <CardGalleryItem
              key={item.key}
              item={item}
              index={i}
              themeColor={themeColor}
              highlight={highlightKey === item.key}
              onClick={() => setLightbox(item)}
            />
          ))}
        </ul>
      )}

      {visible < displays.length && (
        <div className="mt-12 flex justify-center">
          <GlassButton variant="ghost" onClick={() => setVisible(visible + 48)}>
            {t("card.loadMore")}
          </GlassButton>
        </div>
      )}

      <CardDetailModal item={lightbox} onClose={() => setLightbox(null)} themeColor={themeColor} />
    </>
  );
}
