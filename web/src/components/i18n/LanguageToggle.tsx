"use client";

import { LOCALE_LABELS } from "@/lib/i18n/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, cycleLocale, t } = useLocale();

  return (
    <button
      type="button"
      onClick={cycleLocale}
      aria-label={t("lang.switch")}
      title={t("lang.switch")}
      className={cn("lang-toggle chrome-pill-btn", className)}
    >
      <span className="lang-toggle-icon" aria-hidden>
        🌐
      </span>
      <span className="chrome-pill-btn-label">{LOCALE_LABELS[locale]}</span>
    </button>
  );
}
