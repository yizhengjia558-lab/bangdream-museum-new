"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { AssetImage } from "@/components/ui/AssetImage";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchSongsCatalog } from "@/lib/data";
import type { SongData } from "@/lib/data-types";
import { getBandName } from "@/lib/i18n/display";
import {
  filterSongsByBand,
  filterSongsByQuery,
  getSongAltTitle,
  getSongJacketUrl,
  getSongTitle,
  resolveSongBand,
} from "@/lib/songs";
import { BAND_THEMES, type BandSlug } from "@/lib/themes";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 60;

export function MusicPageView() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const bandParam = searchParams.get("band");
  const activeSlug =
    bandParam && BAND_THEMES.some((band) => band.slug === bandParam)
      ? (bandParam as BandSlug)
      : null;
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
  }, [activeSlug, query]);

  const filtered = useMemo(() => {
    if (!songs) return [];
    return filterSongsByQuery(filterSongsByBand(songs, activeSlug), query);
  }, [songs, activeSlug, query]);

  const shown = filtered.slice(0, visible);

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

          <div className="music-page__filters" aria-label={t("music.filterBand")}>
            <Link
              href="/music/"
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
                  href={`/music/?band=${band.slug}`}
                  className={cn("music-page__chip", active && "music-page__chip--active")}
                  style={{ ["--chip-color" as string]: band.colors.primary } as CSSProperties}
                  aria-current={active ? "page" : undefined}
                >
                  {getBandName(band, locale)}
                </Link>
              );
            })}
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
                {shown.map((song) => {
                  const band = resolveSongBand(song);
                  const color = band?.colors.primary ?? accent;
                  const title = getSongTitle(song, locale);
                  const alt = getSongAltTitle(song, locale);
                  const jacket = getSongJacketUrl(song);
                  return (
                    <article
                      key={song.id}
                      role="listitem"
                      className="music-jacket music-jacket--live"
                      style={{ ["--jacket-color" as string]: color }}
                    >
                      <div className="music-jacket__art">
                        {jacket ? (
                          <AssetImage
                            src={jacket}
                            alt={title}
                            fill
                            variant="full"
                            className="object-cover"
                          />
                        ) : (
                          <span className="music-jacket__glyph">{t("music.jacketPlaceholder")}</span>
                        )}
                        {band ? (
                          <span className="music-jacket__band">{getBandName(band, locale)}</span>
                        ) : null}
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
