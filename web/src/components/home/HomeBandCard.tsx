"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";
import type { CharacterData } from "@/lib/data";

export function HomeBandCard({
  band,
  representative,
  coverImage,
  memberCount,
  cardCount,
  index,
}: {
  band: BandTheme;
  representative: CharacterData | undefined;
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
                  className="card-image object-contain object-bottom drop-shadow-[0_48px_80px_rgba(0,0,0,0.35)] transition-all duration-700 ease-out"
                  priority={index < 2}
                />
              </div>
            ) : null}
          </div>

          <div className="band-showcase-panel-col relative z-20 flex items-center">
            <div className="glass-panel band-showcase-panel relative w-full">
              <div className="glass-reflection pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

              <div className="band-showcase-panel-inner">
                <BandLogo band={band} size="lg" />

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
