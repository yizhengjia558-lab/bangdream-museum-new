"use client";

import { useState, type CSSProperties } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName } from "@/lib/i18n/display";
import {
  getBandCatchCopyUrl,
  getBandLogoUrl,
  type BandLogoSize,
} from "@/lib/bestdori-assets";
import type { BandTheme } from "@/lib/themes";
import { cn } from "@/lib/utils";

/** Official Bestdori band wordmark (+ optional catch-copy pattern). */
export function BandLogo({
  band,
  size = "md",
  showPattern = false,
  className,
}: {
  band: BandTheme;
  size?: "sm" | "md" | "lg";
  /** Soft catch-copy watermark behind the wordmark. */
  showPattern?: boolean;
  className?: string;
}) {
  const { locale } = useLocale();
  const label = getBandName(band, locale);
  const [failed, setFailed] = useState(false);
  const logoSize: BandLogoSize = size === "sm" ? "S" : "L";
  const logoSrc = getBandLogoUrl(band.bestdoriLogoId, logoSize);
  const patternSrc = showPattern ? getBandCatchCopyUrl(band.bestdoriLogoId) : null;

  const shell =
    size === "sm" ? "band-logo band-logo--sm" : size === "lg" ? "band-logo band-logo--lg" : "band-logo band-logo--md";

  if (failed) {
    return (
      <div className={cn(shell, "band-logo--fallback", className)}>
        <div className="band-logo__bar" style={{ background: band.colors.gradient }} />
        <span className="band-logo__text" style={{ color: band.colors.primary }}>
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(shell, className)} style={{ "--band-logo-color": band.colors.primary } as CSSProperties}>
      {patternSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={patternSrc} alt="" className="band-logo__pattern" aria-hidden />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt={label}
        className="band-logo__mark"
        loading="lazy"
        decoding="async"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
