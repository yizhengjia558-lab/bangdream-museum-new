import type { CharacterData, VoiceActorData } from "@/lib/data";
import type { BandTheme } from "@/lib/themes";
import type { Locale } from "./types";

const CJK_RE = /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u33ff]/;

export function getCharacterName(character: CharacterData, locale: Locale): string {
  if (locale === "zh") return character.name_cn;
  if (locale === "ja") return character.name_jp;
  return character.name_jp;
}

export function getCharacterAltName(character: CharacterData, locale: Locale): string | null {
  if (locale === "zh") return character.name_jp;
  if (locale === "ja") return character.name_cn;
  return character.name_cn;
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
    return CJK_RE.test(band.tagline) ? band.sloganEn : band.tagline;
  }
  if (CJK_RE.test(band.tagline)) return band.tagline;
  const sentence = band.description.split("。")[0];
  return sentence ? `${sentence}。` : band.sloganEn;
}
