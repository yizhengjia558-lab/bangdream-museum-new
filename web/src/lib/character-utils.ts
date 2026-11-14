import { getCardTrimDirectUrl } from "./bestdori-assets";
import type { CardData, CharacterData, CharacterSummary } from "./data-types";

function hashSeed(value: string | number): number {
  const text = String(value ?? "");
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function cardArtScore(card: CardData): number {
  let score = 0;
  if (card.rarity.includes("5") || card.stars === 5) score += 50;
  else if (card.rarity.includes("4") || card.stars === 4) score += 35;
  else if (card.rarity.includes("3") || card.stars === 3) score += 15;
  if (card.trained_file || card.trained_image) score += 20;
  if (card.untrained_file || card.untrained_image) score += 10;
  return score;
}

function pickRandomCardArt(
  cards: CardData[],
  seedKey: string | number,
  fallback = ""
): string {
  const withArt = cards
    .map((card) => ({
      src: card.trained_file || card.trained_image || card.untrained_file || card.untrained_image,
      trained: Boolean(card.trained_file || card.trained_image),
      score: cardArtScore(card),
    }))
    .filter((entry) => Boolean(entry.src));

  if (!withArt.length) return fallback;

  const preferred = withArt.filter((entry) => entry.trained && entry.score >= 35);
  const trained = withArt.filter((entry) => entry.trained);
  const pool = preferred.length ? preferred : trained.length ? trained : withArt;
  return pool[hashSeed(seedKey) % pool.length].src;
}

/** Best / random card art for blurred character page backdrop */
export function getCharacterBackdrop(character: CharacterData): string {
  return getCharacterPortrait(character);
}

/**
 * Character tile / hero image: a seeded-random card CG.
 * Avoids SD standing sprites whenever any card art exists.
 */
export function getCharacterPortrait(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): string {
  if (character.cards?.length) {
    const picked = pickRandomCardArt(character.cards, character.id, "");
    if (picked) return picked;
  }

  if (character.portrait) return character.portrait;
  return character.standing;
}

export type StripArt = {
  src: string;
  /** Official site look = Bestdori trim cutout on solid color. */
  kind: "trim" | "standing" | "card";
  /** Vertical focus (%). Lower = favor top of art (faces). */
  faceBiasY: number;
  /** Horizontal focus (%). */
  faceBiasX: number;
};

/**
 * Optional horizontal face bias for fallback CG crops only.
 */
const STRIP_FACE_X: Record<number, number> = {
  1: 48,
  2: 46,
  6: 48,
  9: 44,
  15: 52,
  16: 42,
  18: 52,
  22: 40,
  31: 50,
  32: 48,
  33: 62,
  34: 48,
  35: 48,
  36: 46,
};

function cardStars(card: CardData): number {
  if (typeof card.stars === "number" && card.stars > 0) return card.stars;
  const m = String(card.rarity || "").match(/([1-5])/);
  return m ? Number(m[1]) : 0;
}

function scoreStripCardKind(card: CardData): number {
  const kind = String(card.card_kind || card.bestdori_type || "").toLowerCase();
  if (kind === "normal" || kind === "permanent") return 18;
  if (kind === "limited") return 14;
  if (kind === "dreamfes") return 8;
  if (kind === "kirafes") return -4;
  if (kind === "birthday") return -10;
  if (kind === "collab") return -6;
  return 0;
}

/** Score a 5★ card for official-style trim cutout strips. */
function scoreFiveStarTrim(card: CardData): { src: string; score: number } | null {
  const sd = card.sd_resource_name?.trim();
  if (!sd || cardStars(card) !== 5) return null;
  // Bilibili collab resourcesets rarely ship trim PNGs.
  if (/^bili_/i.test(sd)) return null;
  // Need a trained CG so trim_after_training exists.
  if (!(card.trained_file || card.trained_image)) return null;

  const name = `${card.card_name || ""} ${card.event || ""}`.toLowerCase();
  let score = 100 + scoreStripCardKind(card) * 1.6;

  // Official strips favor clear forward/3/4 portraits — demote back/profile-heavy titles.
  if (/背影|侧颜|横顔|後ろ|背中|回头|振り返/.test(name)) score -= 24;
  if (/水着|泳|海|骑|車|车|鼓|ドラム/.test(name)) score -= 12;

  // Mild recency boost — avoid always picking the newest scenic limited.
  const idNum = Number(card.bestdori_card_id ?? card.id);
  if (Number.isFinite(idNum)) score += Math.min(8, Math.floor(idNum / 600));

  return {
    src: getCardTrimDirectUrl(sd, "after_training"),
    score,
  };
}

function pickFiveStarTrimStrip(
  character: Pick<CharacterSummary, "id"> & { cards?: CardData[] }
): StripArt | null {
  if (!character.cards?.length) return null;

  const ranked = character.cards
    .map(scoreFiveStarTrim)
    .filter(Boolean) as Array<{ src: string; score: number }>;

  if (!ranked.length) return null;

  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.filter((entry) => entry.score >= ranked[0].score - 8);
  const chosen = top[hashSeed(character.id) % top.length];

  return {
    src: chosen.src,
    kind: "trim",
    faceBiasY: 42,
    faceBiasX: 50,
  };
}

/** Score a 5★ trained full CG (fallback when trim is unavailable). */
function scoreFiveStarTrained(card: CardData): { src: string; score: number } | null {
  const src = card.trained_file || card.trained_image;
  if (!src || cardStars(card) !== 5) return null;

  const name = `${card.card_name || ""} ${card.event || ""}`.toLowerCase();
  let score = 100 + scoreStripCardKind(card);

  if (/背影|鼓|ドラム|drum|骑|馳|驰|泳|水着|游泳池|海|雨|车|車|猫|停车场|駐車場/.test(name)) {
    score -= 28;
  }
  if (/舞台|ライブ|concert|stage|演奏/.test(name)) score -= 10;

  const idNum = Number(card.bestdori_card_id ?? card.id);
  if (Number.isFinite(idNum)) score += Math.min(12, Math.floor(idNum / 400));

  return { src, score };
}

function pickFiveStarTrainedStrip(
  character: Pick<CharacterSummary, "id"> & { cards?: CardData[] }
): StripArt | null {
  if (!character.cards?.length) return null;

  const ranked = character.cards
    .map(scoreFiveStarTrained)
    .filter(Boolean) as Array<{ src: string; score: number }>;

  if (!ranked.length) return null;

  ranked.sort((a, b) => b.score - a.score);
  const top = ranked.filter((entry) => entry.score >= ranked[0].score - 8);
  const chosen = top[hashSeed(character.id) % top.length];

  return {
    src: chosen.src,
    kind: "card",
    faceBiasY: 18,
    faceBiasX: STRIP_FACE_X[character.id] ?? 50,
  };
}

/**
 * Vertical band-member strip art — match the official site:
 * 5★ trained trim cutout on the character color, faces fully visible.
 */
export function getCharacterStripArt(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): StripArt {
  const trim = pickFiveStarTrimStrip(character);
  if (trim) return trim;

  const fiveStar = pickFiveStarTrainedStrip(character);
  if (fiveStar) return fiveStar;

  if (character.cards?.length) {
    const trained = character.cards
      .map((card) => {
        const src = card.trained_file || card.trained_image;
        if (!src) return null;
        return { src, score: cardStars(card) * 10 };
      })
      .filter(Boolean) as Array<{ src: string; score: number }>;
    trained.sort((a, b) => b.score - a.score);
    if (trained[0]) {
      return {
        src: trained[0].src,
        kind: "card",
        faceBiasY: 18,
        faceBiasX: STRIP_FACE_X[character.id] ?? 50,
      };
    }
  }

  if (character.portrait) {
    return {
      src: character.portrait,
      kind: "card",
      faceBiasY: 18,
      faceBiasX: STRIP_FACE_X[character.id] ?? 50,
    };
  }

  if (character.standing) {
    return {
      src: character.standing,
      kind: "standing",
      faceBiasY: 6,
      faceBiasX: STRIP_FACE_X[character.id] ?? 50,
    };
  }

  return {
    src: "",
    kind: "card",
    faceBiasY: 18,
    faceBiasX: 50,
  };
}
