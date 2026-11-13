import cardLocaleNames from "@/data/card-locale-names.json";
import characterLocale from "@/data/character-locale.json";
import type { CardData, CharacterSummary, VoiceActorData } from "@/lib/data-types";
import type { BandTheme } from "@/lib/themes";
import type { Locale } from "./types";

const CJK_RE = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u33ff]/;

type CardLocaleEntry = { zh?: string; ja?: string; en?: string };
type CharLocaleEntry = { zh?: string; ja?: string; en?: string; birthday?: string | null };

const cardNames = cardLocaleNames as Record<string, CardLocaleEntry>;
const charNames = characterLocale as Record<string, CharLocaleEntry>;

function parseStarCount(rarity: string): number | null {
  const starMatch = rarity.match(/(\d)\s*[-–]?\s*star/i);
  if (starMatch) return Number(starMatch[1]);
  const zhMatch = rarity.match(/(\d)\s*星/);
  if (zhMatch) return Number(zhMatch[1]);
  return null;
}

export function getCardRarityLabel(card: Pick<CardData, "rarity" | "stars">, locale: Locale): string {
  const stars = card.stars ?? parseStarCount(card.rarity);

  if (stars) {
    if (locale === "zh") return `${stars} 星`;
    if (locale === "ja") return `${stars}★`;
    return `${stars}-Star`;
  }

  if (/gallery/i.test(card.rarity)) {
    if (locale === "zh") return "画廊";
    if (locale === "ja") return "ギャラリー";
    return "Gallery";
  }

  return card.rarity;
}

function localizedFromMap(entry: CardLocaleEntry | CharLocaleEntry | undefined, locale: Locale, fallback: string) {
  if (!entry) return fallback;
  if (locale === "zh") return entry.zh || entry.ja || entry.en || fallback;
  if (locale === "ja") return entry.ja || entry.zh || entry.en || fallback;
  return entry.en || entry.ja || entry.zh || fallback;
}

export function getCardName(card: Pick<CardData, "id" | "card_name" | "bestdori_card_id" | "card_name_jp" | "card_name_en">, locale: Locale): string {
  const id = String(card.bestdori_card_id ?? card.id ?? "");
  const mapped = cardNames[id];
  const fromMap = localizedFromMap(mapped, locale, "");
  if (fromMap) return fromMap;

  if (locale === "ja" && card.card_name_jp) return card.card_name_jp;
  if (locale === "en" && card.card_name_en) return card.card_name_en;
  return card.card_name;
}

export function getCharacterName(character: CharacterSummary, locale: Locale): string {
  const mapped = charNames[String(character.id)];
  const fromMap = localizedFromMap(mapped, locale, "");
  if (fromMap) return fromMap;
  if (locale === "zh") return character.name_cn;
  if (locale === "ja") return character.name_jp;
  return character.name_en || character.name_jp;
}

export function getCharacterAltName(character: CharacterSummary, locale: Locale): string | null {
  const mapped = charNames[String(character.id)];
  if (locale === "zh") return mapped?.ja || character.name_jp;
  if (locale === "ja") return mapped?.zh || character.name_cn;
  return mapped?.ja || character.name_jp;
}

export function getVoiceActorName(va: VoiceActorData, locale: Locale): string {
  if (locale === "zh") return va.cv_cn || va.cv_jp;
  if (locale === "ja") return va.cv_jp;
  return va.cv_romaji || va.cv_jp;
}

export function getBandName(band: BandTheme, locale: Locale): string {
  if (locale === "ja") return band.nameJp;
  return band.name;
}

export function getBandSlogan(band: BandTheme, locale: Locale): string {
  if (locale === "en") return band.sloganEn;
  if (locale === "ja") {
    // Prefer Japanese taglines; fall back to English slogan when tagline is ZH-only.
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(band.tagline)) return band.tagline;
    return band.sloganEn;
  }
  if (CJK_RE.test(band.tagline)) return band.tagline;
  const sentence = band.description.split("。")[0];
  return sentence ? `${sentence}。` : band.sloganEn;
}
