"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { HeroBannerSlide } from "@/lib/hero-banner";

const INTERVAL_MS = 6500;

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
      <div
        key={slide.band.slug}
        className="hero-banner-slide hero-banner-slide--enter"
        style={{ "--band-color": slide.band.colors.primary } as CSSProperties}
      >
        <div className="hero-banner-bg-wrap">
          {slide.coverImage ? (
            <AssetImage
              src={slide.coverImage}
              alt=""
              fill
              variant="mobile"
              className="hero-banner-bg object-cover"
              priority={index === 0}
            />
          ) : (
            <div className="hero-banner-bg-fallback" style={{ background: slide.band.colors.gradient }} />
          )}
        </div>
        <div className="hero-banner-overlay" />
        <div className="hero-banner-content">
          <div className="hero-banner-logo-float">
            <BandLogo band={slide.band} size="lg" />
          </div>
          <p className="hero-banner-eyebrow">{t("bands.enterBand")}</p>
          <h2 className="hero-banner-title">{getBandName(slide.band, locale)}</h2>
          <p className="hero-banner-slogan">&ldquo;{getBandSlogan(slide.band, locale)}&rdquo;</p>
          <Link href={slide.href} className="hero-banner-link">
            {t("bands.enterBand")} →
          </Link>
        </div>
      </div>

      <div className="hero-banner-dots" role="tablist" aria-label={t("hero.featuredCards")}>
        {slides.map((s, i) => (
          <button
            key={s.band.slug}
            type="button"
            role="tab"
            aria-selected={i === index}
            className={`hero-banner-dot${i === index ? " hero-banner-dot--active" : ""}`}
            aria-label={getBandName(s.band, locale)}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </section>
  );
}
