"use client";

import { useEffect, useMemo, useState } from "react";
import { CardGalleryItem } from "@/components/cards/CardGalleryItem";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { expandCardDisplays, type CardDisplayItem } from "@/lib/cards";
import { buildMemberMap, filterCardsBySearch } from "@/lib/card-search";
import { getAllCharacters, getAllSiteCards } from "@/lib/data";

const ALL_CARDS = getAllSiteCards();
const ALL_DISPLAYS = expandCardDisplays(ALL_CARDS);
const MEMBER_MAP = buildMemberMap(getAllCharacters());

export function FavoritesPageView() {
  const { t } = useLocale();
  const { favorites, count } = useFavorites();
  const { query, hasQuery } = useGlobalSearch();
  const [visible, setVisible] = useState(48);
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);

  const favoriteDisplays = useMemo(() => {
    const set = new Set(favorites);
    return ALL_DISPLAYS.filter((item) => set.has(item.key));
  }, [favorites]);

  const filtered = useMemo(() => {
    if (!hasQuery) return favoriteDisplays;
    const favoriteCards = ALL_CARDS.filter((card) =>
      favoriteDisplays.some((display) => display.card.id === card.id)
    );
    const matchedCards = filterCardsBySearch(favoriteCards, query, MEMBER_MAP);
    const matchedIds = new Set(matchedCards.map((card) => card.id));
    return favoriteDisplays.filter((display) => matchedIds.has(display.card.id));
  }, [favoriteDisplays, hasQuery, query]);

  useEffect(() => {
    setVisible(48);
  }, [query]);

  const shown = filtered.slice(0, visible);

  return (
    <>
      <BandBackButton color="#e9435e" fallbackHref="/" />

      <section className="page-section relative pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-50" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("favorites.title")} subtitle={t("favorites.subtitle")} />

          <GlassPanel className="favorites-summary mb-8 p-6 sm:p-8">
            <p className="favorites-count">
              {t("favorites.count").replace("{count}", String(count))}
            </p>
            {count > 0 && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("favorites.hint")}</p>
            )}
          </GlassPanel>

          {count === 0 ? (
            <GlassPanel className="favorites-empty p-12 text-center">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{t("favorites.empty")}</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{t("favorites.emptyHint")}</p>
              <div className="mt-8">
                <GlassButton href="/bands/">{t("hero.explore")}</GlassButton>
              </div>
            </GlassPanel>
          ) : filtered.length === 0 ? (
            <GlassPanel className="favorites-empty p-10 text-center">
              <p className="text-[var(--text-secondary)]">{t("search.noResults")}</p>
            </GlassPanel>
          ) : (
            <>
              <ul className="card-gallery-grid">
                {shown.map((item, i) => (
                  <CardGalleryItem
                    key={item.key}
                    item={item}
                    index={i}
                    themeColor="#e9435e"
                    highlight={false}
                    onClick={() => setLightbox(item)}
                  />
                ))}
              </ul>

              {visible < filtered.length && (
                <div className="mt-12 flex justify-center">
                  <GlassButton variant="ghost" onClick={() => setVisible(visible + 48)}>
                    {t("card.loadMore")}
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CardDetailModal
        item={lightbox}
        items={filtered}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
        themeColor="#e9435e"
      />
    </>
  );
}
