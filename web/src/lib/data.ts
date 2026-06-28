import siteData from "@/data/site-data.json";
import { BAND_THEMES, getBandByFolder, getBandBySlug, type BandTheme } from "./themes";

export type CardAttribute = "power" | "cool" | "pure" | "happy";
export type CardKind = "normal" | "limited" | "birthday" | "collab";

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
  character_id?: number;
  character_name_cn?: string;
  character_name_jp?: string;
  band?: string;
  band_folder?: string;
  stars?: number | null;
  attribute?: CardAttribute | "";
  card_kind?: CardKind;
  release_year?: number | null;
  bestdori_card_id?: number | null;
}

export interface VoiceActorData {
  cv_jp: string;
  cv_romaji: string;
  cv_cn: string;
  image: string;
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
  voice_actor?: VoiceActorData;
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

export function getAllSiteCards(): CardData[] {
  return getAllCharacters().flatMap((character) =>
    character.cards.map((card) => ({
      ...card,
      character_id: card.character_id ?? character.id,
      character_name_cn: card.character_name_cn ?? character.name_cn,
      character_name_jp: card.character_name_jp ?? character.name_jp,
      band: card.band ?? character.band,
      band_folder: card.band_folder ?? character.band_folder,
    }))
  );
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
