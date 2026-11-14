"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useMusicPlayer } from "@/components/music/MusicPlayerProvider";
import { SongJacketImage } from "@/components/music/SongJacketImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchSongsCatalog } from "@/lib/data";
import type { SongData } from "@/lib/data-types";
import { getBandName } from "@/lib/i18n/display";
import {
  collectSongYears,
  filterSongsByBand,
  filterSongsByExpert,
  filterSongsByQuery,
  filterSongsByTag,
  filterSongsByYear,
  formatSongTime,
  getSongAltTitle,
  getSongCredit,
  getSongTitle,
  resolveSongBand,
  sortSongs,
  type MusicGalleryView,
  type SongExpertFilter,
  type SongSort,
  type SongTagFilter,
} from "@/lib/songs";
import { BAND_THEMES, type BandSlug } from "@/lib/themes";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 60;

function parseYear(raw: string | null): number | null {
  if (!raw) return null;
  const year = Number(raw);
  return Number.isFinite(year) ? year : null;
}

function parseTag(raw: string | null): SongTagFilter {
  if (raw === "normal" || raw === "anime" || raw === "tie_up") return raw;
  return "all";
}

function parseExpert(raw: string | null): SongExpertFilter {
  if (raw === "le20" || raw === "21to25" || raw === "ge26") return raw;
  return "all";
}

function parseSort(raw: string | null): SongSort {
  if (
    raw === "oldest" ||
    raw === "title" ||
    raw === "bpm" ||
    raw === "length" ||
    raw === "composer"
  ) {
    return raw;
  }
  return "newest";
}

function parseView(raw: string | null): MusicGalleryView {
  return raw === "list" ? "list" : "cover";
}

export function MusicPageView() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const bandParam = searchParams.get("band");
  const activeSlug =
    bandParam && BAND_THEMES.some((band) => band.slug === bandParam)
      ? (bandParam as BandSlug)
      : null;
  const yearFilter = parseYear(searchParams.get("year"));
  const tagFilter = parseTag(searchParams.get("tag"));
  const expertFilter = parseExpert(searchParams.get("expert"));
  const sort = parseSort(searchParams.get("sort"));
  const favoritesOnly = searchParams.get("fav") === "1";
  const view = parseView(searchParams.get("view"));

  const activeBand = activeSlug ? BAND_THEMES.find((band) => band.slug === activeSlug) : null;
  const accent = activeBand?.colors.primary ?? "#e9435e";
  const {
    current,
    playing,
    playSong,
    isSongFavorite,
    toggleSongFavorite,
    favoriteIds,
  } = useMusicPlayer();

  const [songs, setSongs] = useState<SongData[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const itemRefs = useRef<Map<number, HTMLElement>>(new Map());
  const skipScrollRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchSongsCatalog()
      .then((list) => {
        if (!cancelled) setSongs(list);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setVisible(PAGE_SIZE);
    // Filter/search changes should not steal scroll to the now-playing track.
    skipScrollRef.current = true;
  }, [activeSlug, yearFilter, tagFilter, expertFilter, sort, query, favoritesOnly, view]);

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const bandScoped = useMemo(() => {
    if (!songs) return [];
    return filterSongsByBand(songs, activeSlug);
  }, [songs, activeSlug]);

  const years = useMemo(() => collectSongYears(bandScoped), [bandScoped]);

  const filtered = useMemo(() => {
    if (!songs) return [];
    let list = bandScoped;
    list = filterSongsByYear(list, yearFilter);
    list = filterSongsByTag(list, tagFilter);
    list = filterSongsByExpert(list, expertFilter);
    if (favoritesOnly) list = list.filter((song) => favoriteSet.has(song.id));
    list = filterSongsByQuery(list, query);
    return sortSongs(list, sort, locale);
  }, [
    songs,
    bandScoped,
    yearFilter,
    tagFilter,
    expertFilter,
    favoritesOnly,
    favoriteSet,
    query,
    sort,
    locale,
  ]);

  const shown = filtered.slice(0, visible);

  const advancedActive =
    yearFilter != null || tagFilter !== "all" || expertFilter !== "all";

  // Keep year/tag/expert panel open when those filters are active (incl. deep links).
  useEffect(() => {
    if (advancedActive) setFiltersOpen(true);
  }, [advancedActive]);

  // If the selected year disappears after switching band, clear it.
  useEffect(() => {
    if (yearFilter == null) return;
    if (!years.includes(yearFilter)) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("year");
      const qs = params.toString();
      router.replace(qs ? `/music/?${qs}` : "/music/", { scroll: false });
    }
  }, [yearFilter, years, router, searchParams]);

  useEffect(() => {
    if (!current) return;
    const index = filtered.findIndex((song) => song.id === current.id);
    if (index >= 0 && index >= visible) {
      setVisible(index + PAGE_SIZE);
    }
  }, [current, filtered, visible]);

  useEffect(() => {
    if (!current) return;
    if (skipScrollRef.current) {
      skipScrollRef.current = false;
      return;
    }
    const node = itemRefs.current.get(current.id);
    node?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current?.id, playing]);

  function replaceParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    // Always use trailing-slash music path (next.config trailingSlash: true).
    router.replace(qs ? `/music/?${qs}` : "/music/", { scroll: false });
  }

  function clearAdvancedFilters() {
    replaceParams({
      year: null,
      tag: null,
      expert: null,
      fav: null,
    });
  }

  function bandHref(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) params.delete("band");
    else params.set("band", slug);
    // Drop year if it would become invalid for the next band — handled by effect too.
    const qs = params.toString();
    return qs ? `/music/?${qs}` : "/music/";
  }

  function bindRef(songId: number, node: HTMLElement | null) {
    if (node) itemRefs.current.set(songId, node);
    else itemRefs.current.delete(songId);
  }

  return (
    <div className="museum-page music-page relative min-h-screen pb-28" style={{ ["--band-color" as string]: accent }}>
      <BandBackButton color={accent} />

      <section className="page-section relative pt-28 pb-8 sm:pt-32 sm:pb-10">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(55% 45% at 50% 12%, ${accent}22, transparent 70%)`,
          }}
          aria-hidden
        />
        <div className="relative page-container">
          <SectionHeading title={t("music.title")} subtitle={t("music.subtitle")} />
          {songs ? (
            <p className="music-page__count">
              {t("music.count").replace("{count}", String(filtered.length))}
            </p>
          ) : null}

          <div className="music-page__toolbar">
            <label className="music-page__search music-page__search--live">
              <span className="music-page__search-icon" aria-hidden>
                ⌕
              </span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("music.searchPlaceholder")}
                className="music-page__search-input"
              />
            </label>
            <div className="music-page__view-toggle" role="group" aria-label={t("music.viewMode")}>
              <button
                type="button"
                className={cn("music-page__chip", view === "cover" && "music-page__chip--active")}
                onClick={() => replaceParams({ view: null })}
              >
                {t("music.viewCover")}
              </button>
              <button
                type="button"
                className={cn("music-page__chip", view === "list" && "music-page__chip--active")}
                onClick={() => replaceParams({ view: "list" })}
              >
                {t("music.viewList")}
              </button>
            </div>
            <button
              type="button"
              className={cn(
                "music-page__chip music-page__filters-toggle",
                (filtersOpen || advancedActive) && "music-page__chip--active"
              )}
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
            >
              {filtersOpen ? t("music.filtersHide") : t("music.filtersShow")}
              {advancedActive ? " ·" : ""}
            </button>
            {advancedActive || favoritesOnly ? (
              <button type="button" className="music-page__chip" onClick={clearAdvancedFilters}>
                {t("music.filtersClear")}
              </button>
            ) : null}
          </div>

          <div className="music-page__filter-block">
            <p className="music-page__filter-label">{t("music.filterBand")}</p>
            <div className="music-page__filters" aria-label={t("music.filterBand")}>
              <Link
                href={bandHref(null)}
                className={cn("music-page__chip", !activeSlug && "music-page__chip--active")}
                aria-current={!activeSlug ? "page" : undefined}
              >
                {t("music.allBands")}
              </Link>
              {BAND_THEMES.map((band) => {
                const active = band.slug === activeSlug;
                return (
                  <Link
                    key={band.slug}
                    href={bandHref(band.slug)}
                    className={cn("music-page__chip", active && "music-page__chip--active")}
                    style={{ ["--chip-color" as string]: band.colors.primary } as CSSProperties}
                    aria-current={active ? "page" : undefined}
                  >
                    {getBandName(band, locale)}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="music-page__filter-block">
            <p className="music-page__filter-label">{t("music.sort")}</p>
            <div className="music-page__filters" aria-label={t("music.sort")}>
              {(
                [
                  ["newest", t("music.sortNewest")],
                  ["oldest", t("music.sortOldest")],
                  ["title", t("music.sortTitle")],
                  ["bpm", t("music.sortBpm")],
                  ["length", t("music.sortLength")],
                  ["composer", t("music.sortComposer")],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={cn("music-page__chip", sort === value && "music-page__chip--active")}
                  onClick={() =>
                    replaceParams({
                      sort: sort === value || value === "newest" ? null : value,
                    })
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="music-page__filter-block">
            <p className="music-page__filter-label">{t("music.filterFavorite")}</p>
            <div className="music-page__filters" aria-label={t("music.filterFavorite")}>
              <button
                type="button"
                className={cn("music-page__chip", !favoritesOnly && "music-page__chip--active")}
                onClick={() => replaceParams({ fav: null })}
              >
                {t("music.favAll")}
              </button>
              <button
                type="button"
                className={cn("music-page__chip", favoritesOnly && "music-page__chip--active")}
                onClick={() => replaceParams({ fav: favoritesOnly ? null : "1" })}
              >
                ♥ {t("music.favOnly")}
                {favoriteIds.length > 0 ? ` (${favoriteIds.length})` : ""}
              </button>
            </div>
          </div>

          {filtersOpen ? (
            <div className="music-page__filters-panel">
              <div className="music-page__filter-block">
                <p className="music-page__filter-label">{t("music.filterYear")}</p>
                <div className="music-page__filters" aria-label={t("music.filterYear")}>
                  <button
                    type="button"
                    className={cn("music-page__chip", yearFilter == null && "music-page__chip--active")}
                    onClick={() => replaceParams({ year: null })}
                  >
                    {t("music.allYears")}
                  </button>
                  {years.map((year) => (
                    <button
                      key={year}
                      type="button"
                      className={cn("music-page__chip", yearFilter === year && "music-page__chip--active")}
                      onClick={() =>
                        replaceParams({ year: yearFilter === year ? null : String(year) })
                      }
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <div className="music-page__filter-block">
                <p className="music-page__filter-label">{t("music.filterTag")}</p>
                <div className="music-page__filters" aria-label={t("music.filterTag")}>
                  {(
                    [
                      ["all", t("music.tagAll")],
                      ["normal", t("music.tagNormal")],
                      ["anime", t("music.tagAnime")],
                      ["tie_up", t("music.tagTieUp")],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn("music-page__chip", tagFilter === value && "music-page__chip--active")}
                      onClick={() =>
                        replaceParams({
                          tag: value === "all" || tagFilter === value ? null : value,
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="music-page__filter-block">
                <p className="music-page__filter-label">{t("music.filterExpert")}</p>
                <div className="music-page__filters" aria-label={t("music.filterExpert")}>
                  {(
                    [
                      ["all", t("music.expertAll")],
                      ["le20", t("music.expertLe20")],
                      ["21to25", t("music.expert21to25")],
                      ["ge26", t("music.expertGe26")],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={cn("music-page__chip", expertFilter === value && "music-page__chip--active")}
                      onClick={() =>
                        replaceParams({
                          expert: value === "all" || expertFilter === value ? null : value,
                        })
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="page-section relative pb-8">
        <div className="relative page-container">
          {error ? (
            <p className="music-page__empty">{t("music.loadError")}</p>
          ) : !songs ? (
            <p className="music-page__empty">{t("music.loading")}</p>
          ) : shown.length === 0 ? (
            <p className="music-page__empty">{t("music.empty")}</p>
          ) : view === "list" ? (
            <>
              <div className="music-song-list" role="list" aria-label={t("music.title")}>
                {shown.map((song, index) => {
                  const band = resolveSongBand(song);
                  const color = band?.colors.primary ?? accent;
                  const title = getSongTitle(song, locale);
                  const alt = getSongAltTitle(song, locale);
                  const isCurrent = current?.id === song.id;
                  const isPlaying = isCurrent && playing;
                  const liked = isSongFavorite(song.id);
                  const composer = getSongCredit(song, "composer", locale);
                  return (
                    <article
                      key={song.id}
                      role="listitem"
                      ref={(node) => bindRef(song.id, node)}
                      className={cn("music-song-row", isCurrent && "is-current")}
                      style={{ ["--jacket-color" as string]: color }}
                    >
                      <button
                        type="button"
                        className="music-song-row__main"
                        onClick={() => playSong(song, filtered)}
                        aria-label={`${isPlaying ? t("music.pause") : t("music.play")} ${title}`}
                      >
                        <span className="music-song-row__index">
                          {isPlaying ? "♪" : index + 1}
                        </span>
                        <span className="music-song-row__art">
                          <SongJacketImage song={song} alt={title} priority={index < 6} />
                        </span>
                        <span className="music-song-row__meta">
                          <strong>{title}</strong>
                          <em>
                            {[band ? getBandName(band, locale) : null, alt || composer]
                              .filter(Boolean)
                              .join(" · ")}
                          </em>
                        </span>
                        <span className="music-song-row__stats">
                          {song.bpm ? `${Math.round(song.bpm)} BPM` : "—"}
                          <span>{song.length ? formatSongTime(song.length) : "—"}</span>
                        </span>
                      </button>
                      <button
                        type="button"
                        className={cn("music-jacket__btn music-jacket__btn--heart", liked && "is-active")}
                        onClick={() => toggleSongFavorite(song.id)}
                        aria-pressed={liked}
                      >
                        {liked ? "♥" : "♡"}
                      </button>
                    </article>
                  );
                })}
              </div>
              {visible < filtered.length ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    className="music-page__more"
                    onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  >
                    {t("music.loadMore")}
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="music-jacket-wall" role="list" aria-label={t("music.title")}>
                {shown.map((song, index) => {
                  const band = resolveSongBand(song);
                  const color = band?.colors.primary ?? accent;
                  const title = getSongTitle(song, locale);
                  const alt = getSongAltTitle(song, locale);
                  const year = song.published_at
                    ? new Date(song.published_at).getUTCFullYear()
                    : null;
                  const isCurrent = current?.id === song.id;
                  const isPlaying = isCurrent && playing;
                  const liked = isSongFavorite(song.id);
                  return (
                    <article
                      key={song.id}
                      role="listitem"
                      ref={(node) => bindRef(song.id, node)}
                      className={cn(
                        "music-jacket music-jacket--live",
                        isCurrent && "music-jacket--current"
                      )}
                      style={{ ["--jacket-color" as string]: color }}
                    >
                      <button
                        type="button"
                        className="music-jacket__art music-jacket__art--playable"
                        onClick={() => playSong(song, filtered)}
                        aria-label={`${isPlaying ? t("music.pause") : t("music.play")} ${title}`}
                      >
                        <SongJacketImage song={song} alt={title} priority={index < 8} />
                        {band ? (
                          <span className="music-jacket__band">{getBandName(band, locale)}</span>
                        ) : null}
                        {year ? <span className="music-jacket__year">{year}</span> : null}
                        <span className={cn("music-jacket__play-badge", isPlaying && "is-playing")}>
                          {isPlaying ? "❚❚" : "▶"}
                        </span>
                      </button>
                      <div className="music-jacket__meta">
                        <p className="music-jacket__title">{title}</p>
                        {alt ? <p className="music-jacket__sub">{alt}</p> : null}
                      </div>
                      <div className="music-jacket__actions">
                        <button
                          type="button"
                          className={cn("music-jacket__btn", isPlaying && "is-active")}
                          onClick={() => playSong(song, filtered)}
                        >
                          {isPlaying ? t("music.pause") : t("music.play")}
                        </button>
                        <button
                          type="button"
                          className={cn(
                            "music-jacket__btn music-jacket__btn--heart",
                            liked && "is-active"
                          )}
                          onClick={() => toggleSongFavorite(song.id)}
                          aria-pressed={liked}
                        >
                          {liked ? "♥" : "♡"} {t("music.favorite")}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
              {visible < filtered.length ? (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    className="music-page__more"
                    onClick={() => setVisible((n) => n + PAGE_SIZE)}
                  >
                    {t("music.loadMore")}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
