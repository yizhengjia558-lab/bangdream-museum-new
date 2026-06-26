"use client";

import { BAND_THEMES } from "@/lib/themes";
import { getCharactersByBand } from "@/lib/data";
import { getBandCoverImage, getBandStats } from "@/lib/band-covers";
import { HomeBandCard } from "@/components/home/HomeBandCard";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function HomeBandsSection() {
  const { t } = useLocale();

  return (
    <section className="home-bands-section relative page-section pt-10 pb-16 lg:pt-12 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 bloom-layer opacity-40" aria-hidden />
      <div className="relative page-container">
        <header className="mb-12 text-center sm:mb-14">
          <p className="hero-eyebrow text-[var(--text-muted)]">{t("home.collection")}</p>
          <h2 className="section-display mt-5">{t("home.sectionTitle")}</h2>
          <p className="hero-tagline mx-auto mt-4 max-w-lg">{t("home.sectionTagline")}</p>
        </header>

        <div className="flex flex-col gap-14 lg:gap-20">
          {BAND_THEMES.map((band, i) => {
            const members = getCharactersByBand(band.folder);
            const stats = getBandStats(members);
            return (
              <HomeBandCard
                key={band.slug}
                band={band}
                representative={members[0]}
                coverImage={getBandCoverImage(members)}
                memberCount={stats.memberCount}
                cardCount={stats.cardCount}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
