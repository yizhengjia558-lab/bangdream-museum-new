"use client";

import { MemberCard } from "@/components/characters/MemberCard";
import { CardGallery } from "@/components/cards/CardGallery";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CinematicBackground } from "@/components/effects/CinematicBackground";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { CharacterData } from "@/lib/data";
import type { BandTheme } from "@/lib/themes";
import { getCharacterBackdrop } from "@/lib/character-utils";

export function BandDetailView({
  band,
}: {
  band: BandTheme & { members: CharacterData[] };
}) {
  const { t, locale } = useLocale();
  const allCards = band.members.flatMap((m) => m.cards);
  const backdrop = band.members[0] ? getCharacterBackdrop(band.members[0]) : "";
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);

  return (
    <div className="museum-page relative" style={{ ["--band-color" as string]: band.colors.primary }}>
      <BandBackButton color={band.colors.primary} />

      <section className="page-hero-band relative overflow-hidden pt-24 pb-12 sm:pt-28 sm:pb-14">
        {backdrop && <CinematicBackground src={backdrop} overlay={0.42} />}
        <div className="page-hero-scrim pointer-events-none absolute inset-0 z-[1]" aria-hidden />

        <div className="relative z-10 page-container">
          <GlassPanel
            className="max-w-2xl p-10 sm:p-12"
            glow={`radial-gradient(circle, ${band.colors.primary}35, transparent)`}
          >
            <h1 className="type-band-name text-[var(--text-primary)]" style={{ color: band.colors.primary }}>
              {bandName}
            </h1>
            <p className="type-slogan mt-5 text-base sm:text-lg text-[var(--text-secondary)]">&ldquo;{slogan}&rdquo;</p>
          </GlassPanel>
        </div>
      </section>

      <section className="page-section relative py-16 sm:py-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-50" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("band.members")} />
          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-8">
            {band.members.map((member, i) => (
              <MemberCard key={member.id} member={member} theme={band} index={i} />
            ))}
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

      <section className="page-section relative py-16 pb-24 sm:py-20 sm:pb-28">
        <div className="relative page-container">
          <SectionHeading title={t("band.gallery")} subtitle={t("band.gallerySubtitle")} />
          <CardGallery cards={allCards.slice(0, 120)} themeColor={band.colors.primary} />
        </div>
      </section>
    </div>
  );
}
