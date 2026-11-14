"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { BandMemberStrip } from "@/components/bands/BandMemberStrip";
import { CardGallery } from "@/components/cards/CardGallery";
import { BandHotCharacters } from "@/components/bands/BandHotCharacters";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { BandLogo } from "@/components/ui/BandLogo";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import { flattenBandCards } from "@/lib/card-filters";
import { fetchSongsCatalog } from "@/lib/data";
import type { CharacterData, SongData } from "@/lib/data-types";
import { filterSongsByBand, getSongAltTitle, getSongJacketUrl, getSongTitle } from "@/lib/songs";
import type { BandTheme } from "@/lib/themes";

export function BandDetailView({
  band,
}: {
  band: BandTheme & { members: CharacterData[] };
}) {
  const { t, locale } = useLocale();
  const allCards = flattenBandCards(band.members);
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);
  const [songs, setSongs] = useState<SongData[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchSongsCatalog()
      .then((list) => {
        if (!cancelled) setSongs(list);
      })
      .catch(() => {
        if (!cancelled) setSongs([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const bandSongs = useMemo(() => {
    if (!songs) return [];
    return filterSongsByBand(songs, band.slug).slice(0, 8);
  }, [songs, band.slug]);

  return (
    <div className="museum-page relative" style={{ ["--band-color" as string]: band.colors.primary }}>
      <BandBackButton color={band.colors.primary} />

      <section className="band-stage page-section relative pt-28 pb-10 sm:pt-32 sm:pb-14">
        <div
          className="band-stage__glow pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 50% 18%, ${band.colors.primary}28, transparent 70%)`,
          }}
          aria-hidden
        />
        <div className="relative page-container">
          <div className="band-stage__header">
            <h1 className="sr-only">{bandName}</h1>
            <BandLogo band={band} size="lg" showPattern />
            <p className="band-stage__slogan">&ldquo;{slogan}&rdquo;</p>
          </div>

          {band.members.length === 0 ? (
            <p className="mt-10 text-center text-[var(--text-muted)]">{t("bands.emptyMembers")}</p>
          ) : (
            <div className="band-member-strip-row" role="list" aria-label={t("band.members")}>
              {band.members.map((member, i) => (
                <div key={member.id} role="listitem" className="band-member-strip-row__item">
                  <BandMemberStrip member={member} theme={band} index={i} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-12">
            <BandHotCharacters
              bandFolder={band.folder}
              members={band.members}
              accent={band.colors.primary}
            />
            <p className="mt-4 text-center text-sm text-[var(--text-muted)]">
              <Link
                href="/championship/"
                className="championship-inline-link"
                style={{ color: band.colors.primary }}
              >
                {t("championship.navHint")}
              </Link>
            </p>
          </div>
        </div>
      </section>

      <section className="page-section relative py-16 sm:py-20">
        <div className="relative page-container">
          <SectionHeading title={t("band.music")} subtitle={t("band.musicPreviewSubtitle")} />
          <div className="band-music-preview">
            {bandSongs.length > 0
              ? bandSongs.map((song) => {
                  const title = getSongTitle(song, locale);
                  const alt = getSongAltTitle(song, locale);
                  const jacket = getSongJacketUrl(song);
                  return (
                    <div
                      key={song.id}
                      className="band-music-preview__card"
                      style={{ ["--jacket-color" as string]: band.colors.primary }}
                    >
                      <div className="band-music-preview__art">
                        {jacket ? (
                          <AssetImage
                            src={jacket}
                            alt={title}
                            fill
                            variant="full"
                            className="object-cover"
                          />
                        ) : (
                          <span>{t("music.jacketPlaceholder")}</span>
                        )}
                      </div>
                      <div className="band-music-preview__meta">
                        <p className="type-caption text-[var(--text-muted)]">{t("band.signatureTrack")}</p>
                        <p className="band-music-preview__title">{title}</p>
                        {alt ? <p className="band-music-preview__jp">{alt}</p> : null}
                      </div>
                    </div>
                  );
                })
              : band.songs.map((song, index) => {
                  const title = locale === "ja" ? song.titleJp : song.title;
                  return (
                    <div
                      key={`${song.title}-${index}`}
                      className="band-music-preview__card"
                      style={{ ["--jacket-color" as string]: band.colors.primary }}
                    >
                      <div className="band-music-preview__art">
                        <span>{t("music.jacketPlaceholder")}</span>
                      </div>
                      <div className="band-music-preview__meta">
                        <p className="type-caption text-[var(--text-muted)]">{t("band.signatureTrack")}</p>
                        <p className="band-music-preview__title">{title}</p>
                        {locale !== "ja" && <p className="band-music-preview__jp">{song.titleJp}</p>}
                      </div>
                    </div>
                  );
                })}
          </div>
          <p className="mt-6 text-center">
            <Link
              href={`/music/?band=${band.slug}`}
              className="championship-inline-link"
              style={{ color: band.colors.primary }}
            >
              {t("band.musicLibraryLink")}
            </Link>
          </p>
        </div>
      </section>

      <section className="page-section relative py-16 pb-[calc(7rem+env(safe-area-inset-bottom))] sm:py-20 sm:pb-[calc(8rem+env(safe-area-inset-bottom))]">
        <div className="relative page-container">
          <SectionHeading title={t("band.gallery")} subtitle={t("band.gallerySubtitle")} />
          <CardGallery cards={allCards} themeColor={band.colors.primary} members={band.members} />
        </div>
      </section>
    </div>
  );
}
