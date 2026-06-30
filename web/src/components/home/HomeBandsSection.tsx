"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { HomeBandEntry } from "@/lib/data-types";
import { BAND_THEMES } from "@/lib/themes";

export function HomeBandsSection({ bands }: { bands: HomeBandEntry[] }) {
  const { t } = useLocale();

  return (
    <section className="home-bands-section relative page-section pt-10 pb-16 lg:pt-12 lg:pb-24">
      <div className="pointer-events-none absolute inset-0 bloom-layer opacity-40" aria-hidden />
      <div className="relative page-container">
        <header className="mb-12 text-center sm:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="hero-eyebrow text-[var(--text-muted)]"
          >
            {t("home.collection")}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="section-display mt-5"
          >
            {t("home.sectionTitle")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="hero-tagline mx-auto mt-4 max-w-lg"
          >
            {t("home.sectionTagline")}
          </motion.p>
        </header>

        <div className="flex flex-col gap-14 lg:gap-20">
          {bands.map((entry, i) => {
            const band = BAND_THEMES.find((theme) => theme.slug === entry.slug);
            if (!band) return null;

            return (
              <HomeBandCard
                key={entry.slug}
                band={band}
                representative={entry.representative}
                coverImage={entry.coverImage}
                memberCount={entry.memberCount}
                cardCount={entry.cardCount}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function HomeBandCard({
  band,
  representative,
  coverImage,
  memberCount,
  cardCount,
  index,
}: {
  band: (typeof BAND_THEMES)[number];
  representative: HomeBandEntry["representative"];
  coverImage: string;
  memberCount: number;
  cardCount: number;
  index: number;
}) {
  const href = `/bands/${band.slug}/`;
  const { t, locale } = useLocale();
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);

  return (
    <Link href={href} className="group block">
      <motion.article
        initial={{ opacity: 0, y: 70 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.9, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="band-showcase-card relative min-h-[clamp(520px,85vh,700px)] cursor-pointer overflow-hidden rounded-[36px]"
        style={{ "--band-color": band.colors.primary } as CSSProperties}
      >
        <div className="band-showcase-bg absolute inset-0 overflow-hidden">
          {coverImage ? (
            <AssetImage
              src={coverImage}
              alt=""
              fill
              variant="thumb"
              className="band-showcase-bg-img object-cover object-center transition-all duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full" style={{ background: band.colors.gradient }} />
          )}
        </div>

        <div className="band-showcase-blur pointer-events-none absolute inset-0 transition-all duration-700 group-hover:opacity-70" />
        <div className="band-showcase-gradient pointer-events-none absolute inset-0" />

        <div className="relative z-10 grid h-full min-h-[clamp(520px,85vh,700px)] grid-cols-1 items-end lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative flex h-[min(420px,55vh)] items-end justify-center px-6 pt-14 sm:px-8 sm:pt-16 lg:h-full lg:min-h-0 lg:px-14 lg:pt-24">
            {representative ? (
              <div className="band-showcase-character relative aspect-[3/4] w-full max-w-[400px] lg:max-w-[480px]">
                <AssetImage
                  src={representative.standing}
                  alt={band.name}
                  fill
                  variant="thumb"
                  className="card-image object-contain object-bottom drop-shadow-[0_48px_80px_rgba(0,0,0,0.35)] transition-all duration-700 ease-out"
                  priority={index < 1}
                />
              </div>
            ) : null}
          </div>

          <div className="band-showcase-panel-col relative z-20 flex items-center">
            <div className="glass-panel band-showcase-panel relative w-full">
              <div className="glass-reflection pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="band-showcase-panel-inner">
                <motion.div
                  className="band-logo-float"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 4 + index * 0.3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <BandLogo band={band} size="lg" />
                </motion.div>

                <h2 className="band-showcase-name mt-10" style={{ color: band.colors.primary }}>
                  {bandName}
                </h2>

                <p className="band-showcase-slogan mt-5">&ldquo;{slogan}&rdquo;</p>

                <div className="band-showcase-stats mt-10 flex gap-8 border-t border-[var(--glass-border)] pt-8 sm:gap-10">
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {t("common.members")}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-title)] text-2xl font-extrabold text-[var(--text-primary)]">
                      {memberCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold tracking-[0.2em] text-[var(--text-muted)] uppercase">
                      {t("common.cards")}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-title)] text-2xl font-extrabold text-[var(--text-primary)]">
                      {cardCount}
                    </p>
                  </div>
                </div>

                <div className="band-showcase-cta-row">
                  <span className="glass-button band-showcase-cta pointer-events-none">{t("bands.enterBand")} →</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
