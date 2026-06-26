"use client";

import { useTheme } from "@/components/theme/ThemeProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLocale();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "light" ? t("theme.dark") : t("theme.light")}
      className={cn("theme-toggle chrome-pill-btn", className)}
    >
      <span
        className={cn(
          "h-2.5 w-2.5 shrink-0 rounded-full transition-colors duration-600",
          theme === "light" ? "bg-[#e9435e]" : "bg-[#8b9cff]"
        )}
        aria-hidden
      />
      <span className="chrome-pill-btn-label">
        {theme === "light" ? t("theme.dark") : t("theme.light")}
      </span>
    </button>
  );
}
