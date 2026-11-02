"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { AssetImage } from "@/components/ui/AssetImage";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { HomeBandEntry } from "@/lib/data-types";
import { BAND_THEMES, MAIN_BAND_THEMES, OTHER_BAND_THEMES } from "@/lib/themes";

export function HomeBandsSection({ bands }: { bands: HomeBandEntry[] }) {
  const { t } = useLocale();

  const bySlug = new Map(bands.map((entry) => [entry.slug, entry]));
  const mainEntries = MAIN_BAND_THEMES.map((b) => bySlug.get(b.slug)).filter(Boolean) as HomeBandEntry[];
  const otherEntries = OTHER_BAND_THEMES.map((b) => bySlug.get(b.slug)).filter(Boolean) as HomeBandEntry[];

  return (
    <section className="home-bands-section relative page-section pt-10 pb-16 lg:pt-12 lg:pb-24">
      <div className="relative page-container">
        <header className="mb-12 text-center sm:mb-14">
          <p className="hero-eyebrow text-[var(--text-muted)]">{t("home.collection")}</p>
          <h2 className="section-display mt-5">{t("home.sectionTitle")}</h2>
          <p className="hero-tagline mx-auto mt-4 max-w-lg">{t("home.sectionTagline")}</p>
        </header>

        <div className="flex flex-col gap-14 lg:gap-20">
          {mainEntries.map((entry, i) => {
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

        {otherEntries.length > 0 ? (
          <div className="mt-20 lg:mt-28">
            <header className="mb-12 text-center sm:mb-14">
              <p className="hero-eyebrow text-[var(--text-muted)]">{t("home.otherCollection")}</p>
              <h2 className="section-display mt-5">{t("home.otherSectionTitle")}</h2>
              <p className="hero-tagline mx-auto mt-4 max-w-lg">{t("home.otherSectionTagline")}</p>
            </header>

            <div className="flex flex-col gap-14 lg:gap-20">
              {otherEntries.map((entry, i) => {
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
                    index={mainEntries.length + i}
                  />
                );
              })}
            </div>
          </div>
        ) : null}
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
      <article
        className="band-showcase-card relative min-h-[clamp(520px,85vh,700px)] cursor-pointer overflow-hidden rounded-[36px]"
        style={
          {
            "--band-color": band.colors.primary,
            contentVisibility: index > 0 ? "auto" : undefined,
            containIntrinsicSize: index > 0 ? "auto 640px" : undefined,
          } as CSSProperties
        }
      >
        <div className="band-showcase-bg absolute inset-0 overflow-hidden">
          {coverImage ? (
            <AssetImage
              src={coverImage}
              alt=""
              fill
              variant="mobile"
              priority={index < 1}
              className="band-showcase-bg-img object-cover object-center"
            />
          ) : (
            <div className="h-full w-full" style={{ background: band.colors.gradient }} />
          )}
        </div>

        <div className="band-showcase-gradient pointer-events-none absolute inset-0" />

        <div className="relative z-10 grid h-full min-h-[clamp(520px,85vh,700px)] grid-cols-1 items-end lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative flex h-[min(420px,55vh)] items-end justify-center px-6 pt-14 sm:px-8 sm:pt-16 lg:h-full lg:min-h-0 lg:px-14 lg:pt-24">
            {representative?.portrait || representative?.standing ? (
              <div className="band-showcase-character relative aspect-[3/4] w-full max-w-[400px] lg:max-w-[480px]">
                <AssetImage
                  src={representative.portrait || representative.standing}
                  alt={band.name}
                  fill
                  variant="mobile"
                  className="card-image object-contain object-bottom"
                  priority={index < 1}
                />
              </div>
            ) : null}
          </div>

          <div className="band-showcase-panel-col relative z-20 flex items-center">
            <div className="glass-panel band-showcase-panel relative w-full">
              <div className="band-showcase-panel-inner">
                <div className="band-logo-float">
                  <BandLogo band={band} size="lg" />
                </div>

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
      </article>
    </Link>
  );
}
