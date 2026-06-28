"use client";

import { BAND_THEMES } from "@/lib/themes";
import { getCharactersByBand } from "@/lib/data";
import { getBandCoverImage, getBandStats } from "@/lib/band-covers";
import { HomeBandCard } from "@/components/home/HomeBandCard";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { motion } from "framer-motion";

export function HomeBandsSection() {
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
          {BAND_THEMES.map((band, i) => {
            const members = getCharactersByBand(band.folder);
            const stats = getBandStats(members);
            return (
              <HomeBandCard
                key={band.slug}
                band={band}
                representative={members[0]}
                coverImage={getBandCoverImage(members)}
                memberCount={stats.memberCount}
                cardCount={stats.cardCount}
                index={i}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
