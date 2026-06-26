export type Locale = "zh" | "en" | "ja";

export const LOCALES: Locale[] = ["zh", "en", "ja"];

export const LOCALE_LABELS: Record<Locale, string> = {
  zh: "中文",
  en: "EN",
  ja: "日本語",
};

export const LOCALE_HTML_LANG: Record<Locale, string> = {
  zh: "zh-CN",
  en: "en",
  ja: "ja",
};
