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
  kind: "standing" | "card";
  /** Vertical focus (%). Lower = favor top of art (faces). */
  faceBiasY: number;
  /** Horizontal focus (%). */
  faceBiasX: number;
};

/**
 * Optional horizontal face bias when 5★ trained art is used.
 * Useful for characters who sit off-center in many CGs.
 */
const STRIP_FACE_X: Record<number, number> = {
  1: 48, // Kasumi
  2: 46, // Tae
  6: 48, // Ran
  9: 44, // Tomoe
  15: 52, // Michelle
  16: 42, // Aya — often profile / back of hair
  18: 52, // Yukina
  22: 40, // Sayo — often left-framed
  31: 50, // LAYER
  32: 48, // LOCK
  33: 62, // MASKING
  34: 48, // PAREO
  35: 48, // CHU2
  36: 46, // Tomori
};

function cardStars(card: CardData): number {
  if (typeof card.stars === "number" && card.stars > 0) return card.stars;
  const m = String(card.rarity || "").match(/([1-5])/);
  return m ? Number(m[1]) : 0;
}

/** Score a 5★ trained CG for tall-strip face visibility. */
function scoreFiveStarTrained(card: CardData): { src: string; score: number } | null {
  const src = card.trained_file || card.trained_image;
  if (!src || cardStars(card) !== 5) return null;

  const name = `${card.card_name || ""} ${card.event || ""}`.toLowerCase();
  const kind = String(card.card_kind || card.bestdori_type || "").toLowerCase();

  let score = 100;

  // Prefer permanent / limited stage portraits; kirafes can be very wide scenic.
  if (kind === "normal" || kind === "permanent") score += 18;
  else if (kind === "limited") score += 14;
  else if (kind === "dreamfes") score += 8;
  else if (kind === "kirafes") score -= 6;
  else if (kind === "birthday") score -= 12;

  // Wide scenic / prop-heavy titles often lose the face in a 9:22 crop.
  if (/背影|鼓|ドラム|drum|骑|馳|驰|泳|水着|游泳池|海|雨|车|車|猫|停车场|駐車場/.test(name)) {
    score -= 28;
  }
  if (/舞台|ライブ|concert|stage|演奏/.test(name)) score -= 10;

  // Slight preference for newer ids (usually sharper assets).
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
  // Stable pick among near-top scores so strips don't jump on tiny score noise.
  const top = ranked.filter((entry) => entry.score >= ranked[0].score - 8);
  const chosen = top[hashSeed(character.id) % top.length];

  return {
    src: chosen.src,
    kind: "card",
    // 5★ trained faces sit a bit lower than untrained busts — bias toward upper third.
    faceBiasY: 18,
    faceBiasX: STRIP_FACE_X[character.id] ?? 50,
  };
}

/**
 * Vertical band-member strip art: always prefer a 5★ trained CG when available,
 * cropped toward the face. Falls back to portrait / any trained / standing.
 */
export function getCharacterStripArt(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): StripArt {
  const fiveStar = pickFiveStarTrainedStrip(character);
  if (fiveStar) return fiveStar;

  // Fallback: any trained art (prefer higher rarity).
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
