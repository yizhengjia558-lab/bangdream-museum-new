"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, type CSSProperties } from "react";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName } from "@/lib/i18n/display";
import { BAND_THEMES, type BandSlug, type BandTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

type PreviewTrack = {
  key: string;
  title: string;
  titleJp: string;
  band: BandTheme;
};

function buildPreviewTracks(activeSlug: string | null): PreviewTrack[] {
  const bands = activeSlug
    ? BAND_THEMES.filter((band) => band.slug === activeSlug)
    : BAND_THEMES;

  const tracks: PreviewTrack[] = [];
  for (const band of bands) {
    band.songs.forEach((song, index) => {
      tracks.push({
        key: `${band.slug}-${index}`,
        title: song.title,
        titleJp: song.titleJp,
        band,
      });
    });
  }

  // Fill the cover wall so the gallery reads as a museum even before assets land.
  if (!activeSlug) {
    for (const band of BAND_THEMES) {
      for (let i = 0; i < 2; i++) {
        tracks.push({
          key: `${band.slug}-slot-${i}`,
          title: "—",
          titleJp: "",
          band,
        });
      }
    }
  }

  return tracks;
}

export function MusicPageView() {
  const { t, locale } = useLocale();
  const searchParams = useSearchParams();
  const bandParam = searchParams.get("band");
  const activeSlug =
    bandParam && BAND_THEMES.some((band) => band.slug === bandParam)
      ? (bandParam as BandSlug)
      : null;
  const activeBand = activeSlug ? BAND_THEMES.find((band) => band.slug === activeSlug) : null;
  const tracks = useMemo(() => buildPreviewTracks(activeSlug), [activeSlug]);
  const accent = activeBand?.colors.primary ?? "#e9435e";

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
          <p className="music-page__banner" role="status">
            {t("music.comingSoon")}
          </p>
          <p className="music-page__hint">{t("music.previewHint")}</p>

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
                  style={
                    {
                      ["--chip-color" as string]: band.colors.primary,
                    } as CSSProperties
                  }
                  aria-current={active ? "page" : undefined}
                >
                  {getBandName(band, locale)}
                </Link>
              );
            })}
          </div>

          <div className="music-page__search" aria-hidden>
            <span className="music-page__search-icon">⌕</span>
            <span className="music-page__search-text">{t("music.searchPlaceholder")}</span>
          </div>
        </div>
      </section>

      <section className="page-section relative pb-8">
        <div className="relative page-container">
          {tracks.length === 0 ? (
            <p className="music-page__empty">{t("music.emptyBand")}</p>
          ) : (
            <div className="music-jacket-wall" role="list" aria-label={t("music.title")}>
              {tracks.map((track) => {
                const title = locale === "ja" && track.titleJp ? track.titleJp : track.title;
                const isPlaceholder = track.title === "—";
                return (
                  <div
                    key={track.key}
                    role="listitem"
                    className={cn("music-jacket", isPlaceholder && "music-jacket--slot")}
                    style={{ ["--jacket-color" as string]: track.band.colors.primary }}
                  >
                    <div className="music-jacket__art" aria-hidden>
                      <span className="music-jacket__glyph">{t("music.jacketPlaceholder")}</span>
                      <span className="music-jacket__band">{getBandName(track.band, locale)}</span>
                    </div>
                    <div className="music-jacket__meta">
                      <p className="music-jacket__title">{isPlaceholder ? t("music.comingSoon") : title}</p>
                      {!isPlaceholder && locale !== "ja" && track.titleJp ? (
                        <p className="music-jacket__sub">{track.titleJp}</p>
                      ) : null}
                    </div>
                    <div className="music-jacket__actions" aria-hidden>
                      <span className="music-jacket__btn">{t("music.playSoon")}</span>
                      <span className="music-jacket__btn music-jacket__btn--heart">♥ {t("music.favoritesSoon")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
