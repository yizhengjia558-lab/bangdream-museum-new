"use client";

import Link from "next/link";
import { BandMemberStrip } from "@/components/bands/BandMemberStrip";
import { CardGallery } from "@/components/cards/CardGallery";
import { BandHotCharacters } from "@/components/bands/BandHotCharacters";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandLogo } from "@/components/ui/BandLogo";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import { flattenBandCards } from "@/lib/card-filters";
import type { CharacterData } from "@/lib/data-types";
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
          <SectionHeading title={t("band.music")} />
          <div className="grid gap-8 md:grid-cols-2">
            {band.songs.map((song) => (
              <GlassPanel key={song.title} className="p-10 sm:p-12">
                <p className="type-caption text-[var(--text-muted)]">{t("band.signatureTrack")}</p>
                <p className="mt-4 font-[family-name:var(--font-subtitle-active)] text-xl font-bold text-[var(--text-primary)] sm:text-2xl">
                  {locale === "ja" ? song.titleJp : song.title}
                </p>
                {locale !== "ja" && (
                  <p className="mt-2 text-base text-[var(--text-secondary)]">{song.titleJp}</p>
                )}
              </GlassPanel>
            ))}
          </div>
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
