"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translate, type MessageKey } from "@/lib/i18n/messages";
import { LOCALE_HTML_LANG, LOCALES, type Locale } from "@/lib/i18n/types";

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  cycleLocale: () => void;
  t: (key: MessageKey) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: "zh",
  setLocale: () => {},
  cycleLocale: () => {},
  t: (key) => key,
});

function applyLocale(locale: Locale) {
  document.documentElement.setAttribute("data-locale", locale);
  document.documentElement.lang = LOCALE_HTML_LANG[locale];
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("zh");

  useEffect(() => {
    const stored = localStorage.getItem("bd-locale") as Locale | null;
    const initial = stored && LOCALES.includes(stored) ? stored : "zh";
    setLocaleState(initial);
    applyLocale(initial);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    localStorage.setItem("bd-locale", next);
    applyLocale(next);
  }, []);

  const cycleLocale = useCallback(() => {
    setLocaleState((prev) => {
      const index = LOCALES.indexOf(prev);
      const next = LOCALES[(index + 1) % LOCALES.length];
      localStorage.setItem("bd-locale", next);
      applyLocale(next);
      return next;
    });
  }, []);

  const t = useCallback((key: MessageKey) => translate(locale, key), [locale]);

  const value = useMemo(
    () => ({ locale, setLocale, cycleLocale, t }),
    [locale, setLocale, cycleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
