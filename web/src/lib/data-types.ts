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
  costume_id?: number | null;
  sd_resource_name?: string | null;
  live2d_asset_bundle_name?: string | null;
}

export interface VoiceActorData {
  cv_jp: string;
  cv_romaji: string;
  cv_cn: string;
  image: string;
}

export interface CharacterSummary {
  id: number;
  slug: string;
  name_cn: string;
  name_jp: string;
  band: string;
  band_folder: string;
  standing: string;
  card_count: number;
  voice_actor?: VoiceActorData;
}

export interface CharacterData extends CharacterSummary {
  cards: CardData[];
}

export type HomeBandEntry = {
  slug: string;
  folder: string;
  coverImage: string;
  memberCount: number;
  cardCount: number;
  representative: CharacterSummary;
};

export type RiverCardItem = {
  src: string;
  band: string;
};
