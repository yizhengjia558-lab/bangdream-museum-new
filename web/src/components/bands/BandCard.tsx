"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { FitText } from "@/components/ui/FitText";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";

export function BandCard({ band, index }: { band: BandTheme; index: number }) {
  const { t, locale } = useLocale();
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);

  return (
    <motion.li
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="h-full"
    >
      <Link href={`/bands/${band.slug}/`} className="group block h-full">
        <GlassPanel
          className="band-card-shell h-full overflow-hidden p-8 transition duration-500 group-hover:-translate-y-1 sm:p-10"
          glow={`radial-gradient(circle at 80% 20%, ${band.colors.primary}30, transparent 60%)`}
        >
          <div className="band-card-accent h-1 w-12 rounded-full" style={{ background: band.colors.gradient }} />

          <FitText
            text={bandName}
            className="band-card-name font-[family-name:var(--font-title-active)] font-extrabold leading-tight tracking-tight"
            boxClassName="band-card-name-box"
            minPx={13}
            maxPx={22}
            maxLines={3}
            style={{ color: band.colors.primary }}
          />

          <p className="band-card-slogan type-slogan mt-4 line-clamp-2 text-sm sm:text-base">&ldquo;{slogan}&rdquo;</p>

          <p className="band-card-cta mt-auto pt-6 font-[family-name:var(--font-subtitle-active)] text-sm font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase transition group-hover:text-[var(--text-secondary)]">
            {t("bands.enterBand")} →
          </p>
        </GlassPanel>
      </Link>
    </motion.li>
  );
}
