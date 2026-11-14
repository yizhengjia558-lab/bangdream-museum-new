export type CardAttribute = "power" | "cool" | "pure" | "happy";
export type CardKind = "normal" | "limited" | "birthday" | "collab" | "kirafes";

export interface CardData {
  id: string;
  card_name: string;
  /** Optional locale overlays (Bestdori prefix). Prefer getCardName(). */
  card_name_jp?: string;
  card_name_en?: string;
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
  character_name_en?: string;
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
  animation_asset_bundle_name?: string | null;
  bestdori_type?: string | null;
  /** Bilibili BV id for KiraFes memorial card cinema */
  bilibili_bvid?: string | null;
  /** Local / public path to KiraFes memorial mp4 */
  kirafes_video?: string | null;
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
  /** English / romaji display name when available. */
  name_en?: string;
  band: string;
  band_folder: string;
  standing: string;
  /** Best trained/untrained card CG for member tiles (preferred over SD standing). */
  portrait?: string;
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
  representative: CharacterSummary | null;
};

export type RiverCardItem = {
  src: string;
  band: string;
};

export type SongDifficulty = {
  easy: number | null;
  normal: number | null;
  hard: number | null;
  expert: number | null;
  special: number | null;
};

export type SongData = {
  id: number;
  band_id: number;
  band_slug: string | null;
  tag: string;
  title_jp: string;
  title_en: string;
  title_tw: string;
  title_cn: string;
  lyricist_jp?: string;
  lyricist_en?: string;
  lyricist_cn?: string;
  composer_jp?: string;
  composer_en?: string;
  composer_cn?: string;
  arranger_jp?: string;
  arranger_en?: string;
  arranger_cn?: string;
  jacket_name: string;
  /** CDN region that hosts the jacket (`jp` / `cn` / …). */
  jacket_region?: string | null;
  jacket_path: string;
  /** Bestdori BGM id, e.g. `bgm001`. */
  bgm_id?: string | null;
  /** Preferred CDN region for full track audio. */
  audio_region?: string | null;
  /** Track length in seconds (from Bestdori). */
  length?: number | null;
  bpm?: number | null;
  published_at: number | null;
  difficulty: SongDifficulty;
};
