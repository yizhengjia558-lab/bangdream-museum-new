"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BandBackButton } from "@/components/bands/BandBackButton";
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
  getSongAltTitle,
  getSongTitle,
  resolveSongBand,
  sortSongs,
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
  if (raw === "oldest" || raw === "title") return raw;
  return "newest";
}

export function MusicPageView() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
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

  const activeBand = activeSlug ? BAND_THEMES.find((band) => band.slug === activeSlug) : null;
  const accent = activeBand?.colors.primary ?? "#e9435e";

  const [songs, setSongs] = useState<SongData[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);

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
  }, [activeSlug, yearFilter, tagFilter, expertFilter, sort, query]);

  const years = useMemo(() => (songs ? collectSongYears(songs) : []), [songs]);

  const filtered = useMemo(() => {
    if (!songs) return [];
    let list = filterSongsByBand(songs, activeSlug);
    list = filterSongsByYear(list, yearFilter);
    list = filterSongsByTag(list, tagFilter);
    list = filterSongsByExpert(list, expertFilter);
    list = filterSongsByQuery(list, query);
    return sortSongs(list, sort, locale);
  }, [songs, activeSlug, yearFilter, tagFilter, expertFilter, query, sort, locale]);

  const shown = filtered.slice(0, visible);

  function replaceParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (!value) params.delete(key);
      else params.set(key, value);
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  function bandHref(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!slug) params.delete("band");
    else params.set("band", slug);
    const qs = params.toString();
    return qs ? `/music/?${qs}` : "/music/";
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
                  onClick={() => replaceParams({ year: String(year) })}
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
                  onClick={() => replaceParams({ tag: value === "all" ? null : value })}
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
                  onClick={() => replaceParams({ expert: value === "all" ? null : value })}
                >
                  {label}
                </button>
              ))}
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
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  className={cn("music-page__chip", sort === value && "music-page__chip--active")}
                  onClick={() => replaceParams({ sort: value === "newest" ? null : value })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

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
                  return (
                    <article
                      key={song.id}
                      role="listitem"
                      className="music-jacket music-jacket--live"
                      style={{ ["--jacket-color" as string]: color }}
                    >
                      <div className="music-jacket__art">
                        <SongJacketImage song={song} alt={title} priority={index < 8} />
                        {band ? (
                          <span className="music-jacket__band">{getBandName(band, locale)}</span>
                        ) : null}
                        {year ? <span className="music-jacket__year">{year}</span> : null}
                      </div>
                      <div className="music-jacket__meta">
                        <p className="music-jacket__title">{title}</p>
                        {alt ? <p className="music-jacket__sub">{alt}</p> : null}
                      </div>
                      <div className="music-jacket__actions" aria-hidden>
                        <span className="music-jacket__btn">{t("music.playSoon")}</span>
                        <span className="music-jacket__btn music-jacket__btn--heart">
                          ♥ {t("music.favoritesSoon")}
                        </span>
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
