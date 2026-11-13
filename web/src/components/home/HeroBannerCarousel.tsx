"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { HeroBannerSlide } from "@/lib/hero-banner";

const INTERVAL_MS = 6500;

export function HeroBannerCarousel({
  slides,
  museumTitle,
  museumSubtitle,
}: {
  slides: HeroBannerSlide[];
  museumTitle?: string;
  museumSubtitle?: string;
}) {
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
    <section className="hero-banner hero-banner--unified" aria-label={t("hero.featuredCards")}>
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
        <div className="hero-banner-content hero-banner-content--unified">
          {museumTitle ? (
            <div className="hero-banner-museum">
              <p className="hero-banner-eyebrow">{t("hero.eyebrow")}</p>
              <h1 className="hero-banner-museum-title">{museumTitle}</h1>
              {museumSubtitle ? <p className="hero-banner-museum-sub">{museumSubtitle}</p> : null}
            </div>
          ) : null}

          <div className="hero-banner-band-block">
            <div className="hero-banner-logo-float">
              <BandLogo band={slide.band} size="lg" showPattern />
            </div>
            <h2 className="sr-only">{getBandName(slide.band, locale)}</h2>
            <p className="hero-banner-slogan">&ldquo;{getBandSlogan(slide.band, locale)}&rdquo;</p>
            <div className="hero-banner-cta-row">
              <Link href="/bands/" className="hero-banner-link hero-banner-link--museum">
                {t("hero.explore")}
              </Link>
              <Link href={slide.href} className="hero-banner-link hero-banner-link--band">
                {t("bands.enterBand")}
              </Link>
            </div>
          </div>
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
