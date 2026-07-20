"use client";

import { MAIN_BAND_THEMES, OTHER_BAND_THEMES } from "@/lib/themes";
import { BandCard } from "@/components/bands/BandCard";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { useLocale } from "@/components/i18n/LocaleProvider";

export function BandsPageView() {
  const { t } = useLocale();

  return (
    <>
      <BandBackButton color="#e9435e" fallbackHref="/" />
      <div className="relative page-container pb-24 pt-28">
        <header className="mb-16 text-center">
          <p className="type-eyebrow">{t("bands.archive")}</p>
          <h1 className="type-section-name mt-4">{t("bands.allBands")}</h1>
        </header>

        <ul className="band-card-grid">
          {MAIN_BAND_THEMES.map((band, i) => (
            <BandCard key={band.slug} band={band} index={i} />
          ))}
        </ul>

        <header className="mb-12 mt-20 text-center sm:mt-24">
          <p className="type-eyebrow">{t("bands.otherArchive")}</p>
          <h2 className="type-section-name mt-4">{t("bands.otherBands")}</h2>
          <p className="hero-tagline mx-auto mt-4 max-w-lg">{t("bands.otherTagline")}</p>
        </header>

        <ul className="band-card-grid">
          {OTHER_BAND_THEMES.map((band, i) => (
            <BandCard key={band.slug} band={band} index={MAIN_BAND_THEMES.length + i} />
          ))}
        </ul>
      </div>
    </>
  );
}
