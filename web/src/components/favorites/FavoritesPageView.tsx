"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { CardGalleryItem } from "@/components/cards/CardGalleryItem";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { useFavorites } from "@/components/favorites/FavoritesProvider";
import { SongJacketImage } from "@/components/music/SongJacketImage";
import { useMusicPlayer } from "@/components/music/MusicPlayerProvider";
import { useGlobalSearch } from "@/components/search/GlobalSearchProvider";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandLogo } from "@/components/ui/BandLogo";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { expandCardDisplays, type CardDisplayItem } from "@/lib/cards";
import { buildMemberMap, filterCardsBySearch } from "@/lib/card-search";
import { fetchCardsCatalog, fetchSongsCatalog } from "@/lib/data";
import type { CardData, SongData } from "@/lib/data-types";
import { resolveFavoriteDisplays } from "@/lib/favorites";
import { getBandName } from "@/lib/i18n/display";
import {
  filterSongsByQuery,
  formatSongTime,
  getSongAltTitle,
  getSongTitle,
  resolveSongBand,
} from "@/lib/songs";
import { getBandByFolder, getBandByName, type BandTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

type FavTab = "cards" | "songs";

function resolveFavoriteBand(item: CardDisplayItem): BandTheme | undefined {
  return (
    (item.card.band_folder ? getBandByFolder(item.card.band_folder) : undefined) ??
    (item.card.band ? getBandByName(item.card.band) : undefined)
  );
}

export function FavoritesPageView() {
  const { t, locale } = useLocale();
  const { favorites, records, count: cardCount, reconcileWithDisplays } = useFavorites();
  const {
    favoriteIds,
    playSong,
    current,
    playing,
    isSongFavorite,
    toggleSongFavorite,
  } = useMusicPlayer();
  const { query, hasQuery } = useGlobalSearch();
  const [tab, setTab] = useState<FavTab>("cards");
  const [visible, setVisible] = useState(24);
  const [lightbox, setLightbox] = useState<CardDisplayItem | null>(null);
  const [catalog, setCatalog] = useState<CardData[] | null>(null);
  const [catalogError, setCatalogError] = useState(false);
  const [songs, setSongs] = useState<SongData[] | null>(null);
  const [songsError, setSongsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchCardsCatalog()
      .then((cards) => {
        if (!cancelled) setCatalog(cards);
      })
      .catch(() => {
        if (!cancelled) setCatalogError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSongsCatalog()
      .then((list) => {
        if (!cancelled) setSongs(list);
      })
      .catch(() => {
        if (!cancelled) setSongsError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const memberMap = useMemo(() => (catalog ? buildMemberMap() : new Map()), [catalog]);
  const allDisplays = useMemo(() => (catalog ? expandCardDisplays(catalog) : []), [catalog]);

  useEffect(() => {
    if (!allDisplays.length) return;
    reconcileWithDisplays(allDisplays);
  }, [allDisplays, reconcileWithDisplays]);

  const favoriteDisplays = useMemo(() => {
    if (!allDisplays.length) return [];
    return resolveFavoriteDisplays(favorites, records, allDisplays);
  }, [allDisplays, favorites, records]);

  const filteredCards = useMemo(() => {
    if (!hasQuery || !catalog) return favoriteDisplays;
    const favoriteCards = catalog.filter((card) =>
      favoriteDisplays.some((display) => display.card.id === card.id)
    );
    const matchedCards = filterCardsBySearch(favoriteCards, query, memberMap);
    const matchedIds = new Set(matchedCards.map((card) => card.id));
    return favoriteDisplays.filter((display) => matchedIds.has(display.card.id));
  }, [catalog, favoriteDisplays, hasQuery, memberMap, query]);

  const favoriteSongs = useMemo(() => {
    if (!songs || favoriteIds.length === 0) return [];
    const byId = new Map(songs.map((song) => [song.id, song]));
    return favoriteIds.map((id) => byId.get(id)).filter(Boolean) as SongData[];
  }, [songs, favoriteIds]);

  const filteredSongs = useMemo(() => {
    if (!hasQuery) return favoriteSongs;
    return filterSongsByQuery(favoriteSongs, query);
  }, [favoriteSongs, hasQuery, query]);

  useEffect(() => {
    setVisible(24);
  }, [query, tab]);

  // Prefer opening the tab that has content when landing.
  useEffect(() => {
    if (cardCount === 0 && favoriteIds.length > 0) setTab("songs");
  }, [cardCount, favoriteIds.length]);

  const grouped = useMemo(() => {
    const map = new Map<string, { band?: BandTheme; label: string; items: CardDisplayItem[] }>();
    for (const item of filteredCards) {
      const band = resolveFavoriteBand(item);
      const key = band?.slug ?? (item.card.band || item.card.band_folder || t("favorites.ungrouped"));
      const label = band?.name ?? (item.card.band || item.card.band_folder || t("favorites.ungrouped"));
      const entry = map.get(key) ?? { band, label, items: [] };
      entry.items.push(item);
      map.set(key, entry);
    }
    return [...map.entries()];
  }, [filteredCards, t]);

  const shownGroups = useMemo(() => {
    let remaining = visible;
    const out: Array<[string, { band?: BandTheme; label: string; items: CardDisplayItem[] }]> = [];
    for (const [key, group] of grouped) {
      if (remaining <= 0) break;
      const slice = group.items.slice(0, remaining);
      remaining -= slice.length;
      out.push([key, { ...group, items: slice }]);
    }
    return out;
  }, [grouped, visible]);

  const shownSongs = filteredSongs.slice(0, visible);
  const totalCount = cardCount + favoriteIds.length;
  const cardsLoading = cardCount > 0 && !catalog && !catalogError;
  const songsLoading = favoriteIds.length > 0 && !songs && !songsError;
  const unresolved =
    cardCount > 0 && !cardsLoading && !catalogError && favoriteDisplays.length === 0 && !hasQuery;
  const detailAccent =
    (lightbox && resolveFavoriteBand(lightbox)?.colors.primary) || "#e9435e";

  return (
    <>
      <BandBackButton color="#e9435e" fallbackHref="/" />

      <section className="page-section relative pt-28 pb-28">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-50" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("favorites.title")} subtitle={t("favorites.subtitle")} />

          <GlassPanel className="favorites-summary mb-6 p-6 sm:p-8">
            <p className="favorites-count">
              {t("favorites.countMixed")
                .replace("{cards}", String(favoriteDisplays.length || cardCount))
                .replace("{songs}", String(favoriteIds.length))}
            </p>
            {totalCount > 0 && (
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{t("favorites.hint")}</p>
            )}
          </GlassPanel>

          <div className="favorites-tabs" role="tablist" aria-label={t("favorites.title")}>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "cards"}
              className={cn("favorites-tabs__btn", tab === "cards" && "is-active")}
              onClick={() => setTab("cards")}
            >
              {t("favorites.tabCards")}
              <span>{favoriteDisplays.length || cardCount}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={tab === "songs"}
              className={cn("favorites-tabs__btn", tab === "songs" && "is-active")}
              onClick={() => setTab("songs")}
            >
              {t("favorites.tabSongs")}
              <span>{favoriteIds.length}</span>
            </button>
          </div>

          {totalCount === 0 ? (
            <GlassPanel className="favorites-empty cute-empty p-12 text-center">
              <div className="cute-empty__doodle cute-empty__doodle--heart" aria-hidden />
              <p className="cute-empty__title">{t("favorites.empty")}</p>
              <p className="cute-empty__hint">{t("favorites.emptyHint")}</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <GlassButton href="/bands/">{t("hero.explore")}</GlassButton>
                <GlassButton href="/music/" variant="ghost">
                  {t("nav.music")}
                </GlassButton>
              </div>
            </GlassPanel>
          ) : tab === "cards" ? (
            catalogError ? (
              <GlassPanel className="favorites-empty cute-empty p-10 text-center">
                <div className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
                <p className="cute-empty__title">{t("favorites.loadError")}</p>
              </GlassPanel>
            ) : cardsLoading ? (
              <GlassPanel className="favorites-empty p-10 text-center">
                <div className="cute-loader" aria-hidden>
                  <span />
                  <span />
                  <span />
                </div>
              </GlassPanel>
            ) : cardCount === 0 ? (
              <GlassPanel className="favorites-empty cute-empty p-10 text-center">
                <div className="cute-empty__doodle cute-empty__doodle--heart" aria-hidden />
                <p className="cute-empty__title">{t("favorites.emptyCards")}</p>
                <p className="cute-empty__hint">{t("favorites.emptyCardsHint")}</p>
                <div className="mt-8">
                  <GlassButton href="/bands/">{t("hero.explore")}</GlassButton>
                </div>
              </GlassPanel>
            ) : unresolved ? (
              <GlassPanel className="favorites-empty cute-empty p-10 text-center">
                <div className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
                <p className="cute-empty__title">{t("favorites.unresolved")}</p>
              </GlassPanel>
            ) : filteredCards.length === 0 ? (
              <GlassPanel className="favorites-empty cute-empty p-10 text-center">
                <div className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
                <p className="cute-empty__title">{t("search.noResults")}</p>
              </GlassPanel>
            ) : (
              <>
                <div className="favorites-groups">
                  {shownGroups.map(([key, group]) => {
                    const accent = group.band?.colors.primary ?? "#e9435e";
                    return (
                      <section
                        key={key}
                        className="favorites-group"
                        style={{ "--fav-accent": accent } as CSSProperties}
                      >
                        <header className="favorites-group__header">
                          {group.band ? (
                            <BandLogo band={group.band} size="sm" />
                          ) : (
                            <h3 className="favorites-group__title">{group.label}</h3>
                          )}
                          <span className="favorites-group__count">{group.items.length}</span>
                        </header>
                        <ul className="card-gallery-grid">
                          {group.items.map((item, i) => (
                            <CardGalleryItem
                              key={item.key}
                              item={item}
                              index={i}
                              themeColor={accent}
                              highlight={false}
                              onClick={() => setLightbox(item)}
                            />
                          ))}
                        </ul>
                      </section>
                    );
                  })}
                </div>

                {visible < filteredCards.length && (
                  <div className="mt-12 flex justify-center">
                    <GlassButton variant="ghost" onClick={() => setVisible(visible + 24)}>
                      {t("card.loadMore")}
                    </GlassButton>
                  </div>
                )}
              </>
            )
          ) : songsError ? (
            <GlassPanel className="favorites-empty cute-empty p-10 text-center">
              <div className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
              <p className="cute-empty__title">{t("music.loadError")}</p>
            </GlassPanel>
          ) : songsLoading ? (
            <GlassPanel className="favorites-empty p-10 text-center">
              <div className="cute-loader" aria-hidden>
                <span />
                <span />
                <span />
              </div>
            </GlassPanel>
          ) : favoriteIds.length === 0 ? (
            <GlassPanel className="favorites-empty cute-empty p-10 text-center">
              <div className="cute-empty__doodle cute-empty__doodle--heart" aria-hidden />
              <p className="cute-empty__title">{t("favorites.emptySongs")}</p>
              <p className="cute-empty__hint">{t("favorites.emptySongsHint")}</p>
              <div className="mt-8">
                <GlassButton href="/music/">{t("nav.music")}</GlassButton>
              </div>
            </GlassPanel>
          ) : filteredSongs.length === 0 ? (
            <GlassPanel className="favorites-empty cute-empty p-10 text-center">
              <div className="cute-empty__doodle cute-empty__doodle--star" aria-hidden />
              <p className="cute-empty__title">{t("search.noResults")}</p>
            </GlassPanel>
          ) : (
            <>
              <div className="favorites-song-list" role="list">
                {shownSongs.map((song, index) => {
                  const band = resolveSongBand(song);
                  const color = band?.colors.primary ?? "#e9435e";
                  const title = getSongTitle(song, locale);
                  const alt = getSongAltTitle(song, locale);
                  const isCurrent = current?.id === song.id;
                  const isPlaying = isCurrent && playing;
                  const liked = isSongFavorite(song.id);
                  return (
                    <article
                      key={song.id}
                      role="listitem"
                      className={cn("favorites-song-row", isCurrent && "is-current")}
                      style={{ ["--jacket-color" as string]: color }}
                    >
                      <button
                        type="button"
                        className="favorites-song-row__main"
                        onClick={() => playSong(song, filteredSongs)}
                        aria-label={`${isPlaying ? t("music.pause") : t("music.play")} ${title}`}
                      >
                        <span className="favorites-song-row__index">
                          {isPlaying ? "♪" : index + 1}
                        </span>
                        <span className="favorites-song-row__art">
                          <SongJacketImage song={song} alt={title} priority={index < 6} />
                        </span>
                        <span className="favorites-song-row__meta">
                          <strong>{title}</strong>
                          <em>
                            {[band ? getBandName(band, locale) : null, alt]
                              .filter(Boolean)
                              .join(" · ")}
                          </em>
                        </span>
                        <span className="favorites-song-row__len">
                          {song.length ? formatSongTime(song.length) : "—"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={cn("music-jacket__btn music-jacket__btn--heart", liked && "is-active")}
                        onClick={() => toggleSongFavorite(song.id)}
                        aria-pressed={liked}
                        aria-label={liked ? t("music.unfavorite") : t("music.favorite")}
                      >
                        {liked ? "♥" : "♡"}
                      </button>
                    </article>
                  );
                })}
              </div>
              {visible < filteredSongs.length ? (
                <div className="mt-10 flex justify-center">
                  <GlassButton variant="ghost" onClick={() => setVisible(visible + 24)}>
                    {t("music.loadMore")}
                  </GlassButton>
                </div>
              ) : (
                <div className="mt-8 flex justify-center">
                  <GlassButton href="/music/?fav=1" variant="ghost">
                    {t("favorites.openMusicFav")}
                  </GlassButton>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <CardDetailModal
        item={lightbox}
        items={filteredCards}
        onSelectItem={setLightbox}
        onClose={() => setLightbox(null)}
        themeColor={detailAccent}
      />
    </>
  );
}
