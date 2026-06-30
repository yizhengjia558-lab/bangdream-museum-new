"use client";

import { StarryParticles } from "@/components/effects/StarryParticles";
import { FloatingLightOrbs } from "@/components/effects/FloatingLightOrbs";
import { HeroBannerCarousel } from "@/components/home/HeroBannerCarousel";
import { CardRiver } from "@/components/home/CardRiver";
import { GlassButton } from "@/components/ui/GlassButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import type { HeroBannerSlide } from "@/lib/hero-banner";
import type { RiverCardItem } from "@/lib/data-types";
import { motion } from "framer-motion";

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
      <div className="home-fx-layer" aria-hidden>
        <StarryParticles />
        <FloatingLightOrbs />
      </div>

      <HeroBannerCarousel slides={bannerSlides} />

      <section className="hero-intro">
        <div className="hero-copy">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hero-eyebrow"
          >
            {t("hero.eyebrow")}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="hero-mega-title hero-mega-title-compact"
          >
            {t("hero.title")}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="hero-subtitle"
          >
            {t("hero.subtitle")}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="hero-tagline max-w-sm"
          >
            {t("hero.tagline")}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="hero-cta-wrap"
          >
            <GlassButton href="/bands/">{t("hero.explore")}</GlassButton>
          </motion.div>
        </div>
      </section>

      <section className="hero-river-strip" aria-label={t("hero.featuredCards")}>
        <CardRiver cards={riverCards} variant="strip" />
      </section>
    </div>
  );
}
