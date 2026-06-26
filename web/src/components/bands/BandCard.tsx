"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";

export function BandCard({ band, index }: { band: BandTheme; index: number }) {
  const { t, locale } = useLocale();
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link href={`/bands/${band.slug}/`} className="group block">
        <GlassPanel
          className="overflow-hidden p-10 sm:p-12 transition duration-500 group-hover:-translate-y-1"
          glow={`radial-gradient(circle at 80% 20%, ${band.colors.primary}30, transparent 60%)`}
        >
          <div className="h-1 w-12 rounded-full" style={{ background: band.colors.gradient }} />
          <h3 className="type-band-name mt-6 text-2xl" style={{ color: band.colors.primary }}>
            {bandName}
          </h3>
          <p className="type-slogan mt-4 text-base sm:text-lg">&ldquo;{slogan}&rdquo;</p>
          <p className="mt-8 font-[family-name:var(--font-subtitle-active)] text-sm font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase transition group-hover:text-[var(--text-secondary)]">
            {t("bands.enterBand")} →
          </p>
        </GlassPanel>
      </Link>
    </motion.div>
  );
}
