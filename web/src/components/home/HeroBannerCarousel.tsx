"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { HeroBannerSlide } from "@/lib/hero-banner";

const INTERVAL_MS = 5500;

export function HeroBannerCarousel({ slides }: { slides: HeroBannerSlide[] }) {
  const { t, locale } = useLocale();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [slides.length]);

  if (!slides.length) return null;

  const slide = slides[index];

  return (
    <section className="hero-banner" aria-label={t("hero.featuredCards")}>
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.band.slug}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          className="hero-banner-slide"
          style={{ "--band-color": slide.band.colors.primary } as CSSProperties}
        >
          <div className="hero-banner-bg-wrap">
            {slide.coverImage ? (
              <AssetImage src={slide.coverImage} alt="" fill variant="thumb" className="hero-banner-bg object-cover" priority />
            ) : (
              <div className="hero-banner-bg-fallback" style={{ background: slide.band.colors.gradient }} />
            )}
          </div>
          <div className="hero-banner-overlay" />
          <div className="hero-banner-content">
            <motion.div
              className="hero-banner-logo-float"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <BandLogo band={slide.band} size="lg" />
            </motion.div>
            <p className="hero-banner-eyebrow">{t("bands.enterBand")}</p>
            <h2 className="hero-banner-title">{getBandName(slide.band, locale)}</h2>
            <p className="hero-banner-slogan">&ldquo;{getBandSlogan(slide.band, locale)}&rdquo;</p>
            <Link href={slide.href} className="hero-banner-link">
              {t("bands.enterBand")} →
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="hero-banner-dots">
        {slides.map((s, i) => (
          <button
            key={s.band.slug}
            type="button"
            className={`hero-banner-dot${i === index ? " hero-banner-dot--active" : ""}`}
            aria-label={getBandName(s.band, locale)}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
