import siteIndex from "@/data/site-index.json";
import { BAND_THEMES, getBandByFolder, getBandBySlug } from "./themes";
import type { CardData, CharacterSummary } from "./data-types";

export type {
  CardAttribute,
  CardData,
  CardKind,
  CharacterData,
  CharacterSummary,
  HomeBandEntry,
  RiverCardItem,
  VoiceActorData,
} from "./data-types";

export function getCharacterSummaries(): CharacterSummary[] {
  return siteIndex.characters as CharacterSummary[];
}

/** Summaries only — full card data is loaded per page from /public/data. */
export function getAllCharacters(): CharacterSummary[] {
  return getCharacterSummaries();
}

export function getCharactersByBand(folder: string): CharacterSummary[] {
  return getCharacterSummaries().filter((character) => character.band_folder === folder);
}

export function getCharacterTheme(character: CharacterSummary) {
  return getBandByFolder(character.band_folder);
}

export { BAND_THEMES, getBandBySlug, getBandByFolder };

export async function fetchCardsCatalog(): Promise<CardData[]> {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  const res = await fetch(`${basePath}/data/cards-catalog.json`);
  if (!res.ok) throw new Error("Failed to load cards catalog");
  const data = (await res.json()) as { cards: CardData[] };
  return data.cards;
}
