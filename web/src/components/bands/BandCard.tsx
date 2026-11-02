"use client";

import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName, getBandSlogan } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";

export function BandCard({ band }: { band: BandTheme; index?: number }) {
  const { t, locale } = useLocale();
  const bandName = getBandName(band, locale);
  const slogan = getBandSlogan(band, locale);

  return (
    <li className="h-full">
      <Link href={`/bands/${band.slug}/`} className="group block h-full">
        <GlassPanel className="band-card-shell h-full overflow-hidden p-8 sm:p-10">
          <div className="band-card-accent h-1 w-12 rounded-full" style={{ background: band.colors.gradient }} />

          <p
            className="band-card-name mt-5 font-[family-name:var(--font-title-active)] text-xl font-extrabold leading-tight tracking-tight sm:text-2xl"
            style={{ color: band.colors.primary }}
          >
            {bandName}
          </p>

          <p className="band-card-slogan type-slogan mt-4 line-clamp-2 text-sm sm:text-base">&ldquo;{slogan}&rdquo;</p>

          <p className="band-card-cta mt-auto pt-6 font-[family-name:var(--font-subtitle-active)] text-sm font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase transition group-hover:text-[var(--text-secondary)]">
            {t("bands.enterBand")} →
          </p>
        </GlassPanel>
      </Link>
    </li>
  );
}
