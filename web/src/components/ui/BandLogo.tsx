"use client";

import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName } from "@/lib/i18n/display";
import type { BandTheme } from "@/lib/themes";

/** Text-based band mark — gradient bar + display name (no image assets required). */
export function BandLogo({ band, size = "md" }: { band: BandTheme; size?: "sm" | "md" | "lg" }) {
  const { locale } = useLocale();
  const barH = size === "sm" ? "h-0.5" : size === "lg" ? "h-1.5" : "h-1";
  const textSize =
    size === "sm" ? "text-[10px] tracking-[0.25em]" : size === "lg" ? "text-xs tracking-[0.35em]" : "text-[11px] tracking-[0.3em]";

  return (
    <div className="inline-flex flex-col gap-2">
      <div className={`w-10 rounded-full ${barH}`} style={{ background: band.colors.gradient }} />
      <span
        className={`font-[family-name:var(--font-title-active)] font-extrabold uppercase ${textSize}`}
        style={{ color: band.colors.primary }}
      >
        {getBandName(band, locale)}
      </span>
    </div>
  );
}
