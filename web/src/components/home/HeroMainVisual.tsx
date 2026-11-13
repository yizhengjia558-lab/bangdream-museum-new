"use client";

import { HeroBannerCarousel } from "@/components/home/HeroBannerCarousel";
import { CardRiver } from "@/components/home/CardRiver";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { HeroBannerSlide } from "@/lib/hero-banner";
import type { RiverCardItem } from "@/lib/data-types";

export function HeroMainVisual({
  riverCards,
  bannerSlides,
}: {
  riverCards: RiverCardItem[];
  bannerSlides: HeroBannerSlide[];
}) {
  const { t } = useLocale();

  return (
    <div className="hero-block hero-block--unified">
      <HeroBannerCarousel slides={bannerSlides} museumTitle={t("hero.title")} museumSubtitle={t("hero.subtitle")} />

      <section className="hero-river-strip" aria-label={t("hero.featuredCards")}>
        <CardRiver cards={riverCards} variant="strip" />
      </section>
    </div>
  );
}
