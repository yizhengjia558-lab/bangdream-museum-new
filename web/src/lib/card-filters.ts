import type { CardData, CharacterData } from "./data-types";

export type CardAttribute = "power" | "cool" | "pure" | "happy";
export type CardKind = "normal" | "limited" | "birthday" | "collab" | "kirafes";

export const CARD_ATTRIBUTES: CardAttribute[] = ["power", "cool", "pure", "happy"];
export const CARD_KINDS: CardKind[] = ["normal", "limited", "kirafes", "birthday", "collab"];
export const CARD_STARS = [1, 2, 3, 4, 5] as const;

export const BAND_FILTER_IDS = [
  "Poppin'Party",
  "Afterglow",
  "Pastel＊Palettes",
  "Roselia",
  "Hello, Happy World!",
  "Morfonica",
  "RAISE A SUILEN",
  "MyGO!!!!!",
] as const;

export type BandFilterId = (typeof BAND_FILTER_IDS)[number];

export interface CardFilterState {
  bands: BandFilterId[];
  members: number[];
  stars: number[];
  attributes: CardAttribute[];
  kinds: CardKind[];
  years: number[];
}

export const EMPTY_CARD_FILTERS: CardFilterState = {
  bands: [],
  members: [],
  stars: [],
  attributes: [],
  kinds: [],
  years: [],
};

export type CardFilterScope = "character" | "band";

export interface CardFilterContext {
  scope: CardFilterScope;
  /** Cards available before filtering (with character context on band pages). */
  cards: CardData[];
  members?: CharacterData[];
  lockedBand?: BandFilterId;
  lockedMemberId?: number;
}

export function isEmptyFilters(filters: CardFilterState): boolean {
  return (
    filters.bands.length === 0 &&
    filters.members.length === 0 &&
    filters.stars.length === 0 &&
    filters.attributes.length === 0 &&
    filters.kinds.length === 0 &&
    filters.years.length === 0
  );
}

export function collectFilterYears(cards: CardData[]): number[] {
  const current = new Date().getFullYear();
  const years = new Set<number>();
  for (const card of cards) {
    const year = card.release_year;
    if (!year || year < 2015 || year > current) continue;
    years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

/** Preserve metadata / build order (no re-sort). */
export function filterCards(cards: CardData[], filters: CardFilterState): CardData[] {
  if (isEmptyFilters(filters)) return cards;

  return cards.filter((card) => {
    if (filters.bands.length && card.band && !filters.bands.includes(card.band as BandFilterId)) {
      return false;
    }
    if (filters.members.length && card.character_id && !filters.members.includes(card.character_id)) {
      return false;
    }
    if (filters.stars.length) {
      if (!card.stars || !filters.stars.includes(card.stars)) return false;
    }
    if (filters.attributes.length) {
      if (!card.attribute || !filters.attributes.includes(card.attribute as CardAttribute)) {
        return false;
      }
    }
    if (filters.kinds.length) {
      const kind = (card.card_kind || "normal") as CardKind;
      if (!filters.kinds.includes(kind)) return false;
    }
    if (filters.years.length) {
      if (!card.release_year || !filters.years.includes(card.release_year)) return false;
    }
    return true;
  });
}

export function attachCharacterContext(cards: CardData[], member: CharacterData): CardData[] {
  return cards.map((card) => ({
    ...card,
    character_id: card.character_id ?? member.id,
    character_name_cn: card.character_name_cn ?? member.name_cn,
    character_name_jp: card.character_name_jp ?? member.name_jp,
    band: card.band ?? member.band,
    band_folder: card.band_folder ?? member.band_folder,
  }));
}

export function flattenBandCards(members: CharacterData[]): CardData[] {
  return members.flatMap((member) => attachCharacterContext(member.cards, member));
}
