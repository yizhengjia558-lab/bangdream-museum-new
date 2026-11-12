"use client";

import { HeroBannerCarousel } from "@/components/home/HeroBannerCarousel";
import { CardRiver } from "@/components/home/CardRiver";
import { GlassButton } from "@/components/ui/GlassButton";
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
    <div className="hero-block">
      <HeroBannerCarousel slides={bannerSlides} />

      <section className="hero-intro">
        <div className="hero-copy hero-copy--enter">
          <p className="hero-eyebrow">{t("hero.eyebrow")}</p>
          <h1 className="hero-mega-title hero-mega-title-compact">{t("hero.title")}</h1>
          <p className="hero-subtitle">{t("hero.subtitle")}</p>
          <div className="hero-cta-wrap">
            <GlassButton href="/bands/">{t("hero.explore")}</GlassButton>
          </div>
        </div>
      </section>

      <section className="hero-river-strip" aria-label={t("hero.featuredCards")}>
        <CardRiver cards={riverCards} variant="strip" />
      </section>
    </div>
  );
}
