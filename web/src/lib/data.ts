import siteData from "@/data/site-data.json";
import { BAND_THEMES, getBandByFolder, getBandBySlug, type BandTheme } from "./themes";

export interface CardData {
  id: string;
  card_name: string;
  rarity: string;
  event: string;
  release_date: string;
  untrained_image: string;
  trained_image: string;
  untrained_file: string;
  trained_file: string;
}

export interface CharacterData {
  id: number;
  slug: string;
  name_cn: string;
  name_jp: string;
  band: string;
  band_folder: string;
  standing: string;
  card_count: number;
  cards: CardData[];
}

export function getAllCharacters(): CharacterData[] {
  return siteData.characters as CharacterData[];
}

export function getCharacterById(id: string | number): CharacterData | undefined {
  return getAllCharacters().find((c) => c.slug === String(id) || c.id === Number(id));
}

export function getCharactersByBand(folder: string): CharacterData[] {
  return getAllCharacters().filter((c) => c.band_folder === folder);
}

export function getBandWithMembers(slug: string): (BandTheme & { members: CharacterData[] }) | undefined {
  const band = getBandBySlug(slug);
  if (!band) return undefined;
  return { ...band, members: getCharactersByBand(band.folder) };
}

export function getFeaturedCards(limit = 12): CardData[] {
  const all = getAllCharacters().flatMap((c) =>
    c.cards.slice(0, 2).map((card) => ({ ...card, character: c }))
  );
  return all.slice(0, limit) as CardData[];
}

export function getCharacterTheme(character: CharacterData) {
  return getBandByFolder(character.band_folder);
}

export { BAND_THEMES, getBandBySlug };
