"use client";

import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";

/** Keeps document title and meta description in sync with the active locale. */
export function DocumentLocale() {
  const { locale, t } = useLocale();

  useEffect(() => {
    document.title = t("meta.title");
    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute("content", t("meta.description"));
    }
  }, [locale, t]);

  return null;
}
