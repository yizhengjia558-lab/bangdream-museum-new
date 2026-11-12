"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { BandLogo } from "@/components/ui/BandLogo";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandSlogan } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";

export function BandCard({ band }: { band: BandTheme; index?: number }) {
  const { t, locale } = useLocale();
  const slogan = getBandSlogan(band, locale);

  return (
    <li className="h-full">
      <Link href={`/bands/${band.slug}/`} className="group block h-full">
        <GlassPanel
          className="band-card-shell h-full overflow-hidden p-8 sm:p-10"
          style={{ "--band-accent": band.colors.primary } as CSSProperties}
        >
          <div className="band-card-accent h-1 w-12 rounded-full" style={{ background: band.colors.gradient }} />

          <div className="band-card-logo mt-6">
            <BandLogo band={band} size="lg" showPattern />
          </div>

          <p className="band-card-slogan type-slogan mt-5 line-clamp-2 text-sm sm:text-base">&ldquo;{slogan}&rdquo;</p>

          <p className="band-card-cta mt-auto pt-6 font-[family-name:var(--font-subtitle-active)] text-sm font-bold tracking-[0.12em] text-[var(--text-muted)] uppercase transition group-hover:text-[var(--text-secondary)]">
            {t("bands.enterBand")} →
          </p>
        </GlassPanel>
      </Link>
    </li>
  );
}
