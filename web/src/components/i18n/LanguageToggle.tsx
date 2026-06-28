"use client";

import { useEffect, useRef, useState } from "react";
import { LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n/types";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useLocale();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const pick = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className={cn("lang-switcher", className)}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={t("lang.switch")}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="lang-toggle chrome-pill-btn"
      >
        <span className="lang-toggle-icon" aria-hidden>
          🌐
        </span>
        <span className="chrome-pill-btn-label">{LOCALE_LABELS[locale]}</span>
      </button>

      {open && (
        <ul className="lang-switcher-menu" role="listbox" aria-label={t("lang.switch")}>
          {LOCALES.map((option) => (
            <li key={option} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={locale === option}
                className={cn("lang-switcher-option", locale === option && "lang-switcher-option--active")}
                onClick={() => pick(option)}
              >
                {LOCALE_LABELS[option]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
