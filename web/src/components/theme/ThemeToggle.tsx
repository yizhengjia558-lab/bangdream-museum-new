"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? t("theme.dark") : t("theme.light")}
      title={isLight ? t("theme.dark") : t("theme.light")}
      className={cn("theme-toggle chrome-sticker-btn", className)}
    >
      <span className="chrome-sticker-btn__glyph" aria-hidden>
        {isLight ? "☾" : "☀"}
      </span>
      <span className="chrome-sticker-btn__label">
        {isLight ? t("theme.dark") : t("theme.light")}
      </span>
    </button>
  );
}
