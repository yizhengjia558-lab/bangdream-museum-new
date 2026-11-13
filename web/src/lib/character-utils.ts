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
 * Characters whose landscape CGs crop badly in a tall strip —
 * always prefer standing so the face stays in frame.
 */
const STRIP_FORCE_STANDING = new Set<number>([
  9, // Tomoe — drum / back-view CGs
  33, // Masuki — face often far right in CGs
]);

/**
 * Optional horizontal face bias when card art is used.
 * Useful for characters who sit off-center in most illustrations.
 */
const STRIP_FACE_X: Record<number, number> = {
  9: 42, // Tomoe
  33: 72, // Masuki / Masking — face tends to sit on the right
  35: 48, // Pareo / Chiyu
};

function scoreStripCard(card: CardData): { src: string; score: number; untrained: boolean } | null {
  const untrained = card.untrained_file || card.untrained_image;
  const trained = card.trained_file || card.trained_image;
  // Prefer untrained busts — trained scenes often hide faces in tall crops.
  const src = untrained || trained;
  if (!src) return null;

  const starMatch = card.rarity.match(/([1-5])/);
  const stars = card.stars ?? (starMatch ? Number(starMatch[1]) : 0);
  const name = `${card.card_name || ""} ${card.event || ""}`.toLowerCase();

  let score = 0;
  if (untrained) score += 45;
  if (stars === 3) score += 26;
  else if (stars === 2) score += 24;
  else if (stars === 1) score += 14;
  else if (stars === 4) score += 8;
  else if (stars === 5) score -= 12;

  if (!untrained && trained) score -= 25;

  // Scenic / prop-heavy titles tend to crop to instruments or backs.
  if (/舞台|鼓|ドラム|演奏|ライブ|concert|stage|drum|背影|夕映|骑|馳|驰/.test(name)) {
    score -= 35;
  }

  return { src, score, untrained: Boolean(untrained) };
}

function pickStripCardArt(
  character: Pick<CharacterSummary, "id"> & { cards?: CardData[] }
): StripArt | null {
  if (!character.cards?.length) return null;

  const ranked = character.cards
    .map(scoreStripCard)
    .filter(Boolean) as Array<{ src: string; score: number; untrained: boolean }>;

  ranked.sort((a, b) => b.score - a.score);
  const best = ranked[0];
  if (!best || best.score < 25) return null;

  return {
    src: best.src,
    kind: "card",
    faceBiasY: best.untrained ? 12 : 16,
    faceBiasX: STRIP_FACE_X[character.id] ?? 50,
  };
}

/**
 * Vertical band-member strip art.
 * Standing first (face always near the top). Card busts only when standing is missing,
 * or when the character is not in the known bad-crop list and we want a bust fallback —
 * currently standing wins whenever available so faces stay framed.
 */
export function getCharacterStripArt(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): StripArt {
  // Standing sprites keep the face near the top of a tall crop.
  if (character.standing) {
    return {
      src: character.standing,
      kind: "standing",
      faceBiasY: 6,
      faceBiasX: STRIP_FACE_X[character.id] ?? 50,
    };
  }

  // No standing: try a face-friendly untrained bust (skip known scenic-prone ids).
  if (!STRIP_FORCE_STANDING.has(character.id)) {
    const fromCards = pickStripCardArt(character);
    if (fromCards) return fromCards;
  }

  if (character.portrait) {
    return {
      src: character.portrait,
      kind: "card",
      faceBiasY: 14,
      faceBiasX: STRIP_FACE_X[character.id] ?? 50,
    };
  }

  const fromCards = pickStripCardArt(character);
  if (fromCards) return fromCards;

  return {
    src: "",
    kind: "standing",
    faceBiasY: 6,
    faceBiasX: 50,
  };
}
