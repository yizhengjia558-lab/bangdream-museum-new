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
 * Optional horizontal face bias when card art is used.
 * Useful for characters who sit off-center in most illustrations.
 */
const STRIP_FACE_X: Record<number, number> = {
  9: 45, // Tomoe
  33: 68, // Masuki / Masking
  35: 48, // Pareo / Chiyu
  2: 48, // Tae
  18: 55, // Yukina
};

function scoreStripCard(card: CardData): { src: string; score: number; untrained: boolean } | null {
  const untrained = card.untrained_file || card.untrained_image;
  const trained = card.trained_file || card.trained_image;
  // Prefer untrained busts — closer waist-up portraits for tall strips.
  const src = untrained || trained;
  if (!src) return null;

  const starMatch = card.rarity.match(/([1-5])/);
  const stars = card.stars ?? (starMatch ? Number(starMatch[1]) : 0);
  const name = `${card.card_name || ""} ${card.event || ""}`.toLowerCase();
  const kind = String(card.card_kind || card.bestdori_type || "").toLowerCase();

  let score = 0;
  if (untrained) score += 50;
  // 3★ / 4★ untrained CGs match the Afterglow museum strips best.
  if (stars === 3) score += 32;
  else if (stars === 4) score += 28;
  else if (stars === 2) score += 16;
  else if (stars === 1) score += 8;
  else if (stars === 5) score -= 6;

  if (!untrained && trained) score -= 18;
  if (kind === "birthday" || /birthday|誕生日|生日/.test(name)) score -= 10;

  // Scenic / prop-heavy titles tend to crop to instruments or backs.
  if (/舞台|鼓|ドラム|演奏|ライブ|concert|stage|drum|背影|夕映|骑|馳|驰|泳|水着|游泳池/.test(name)) {
    score -= 40;
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
  if (!best || best.score < 20) return null;

  return {
    src: best.src,
    kind: "card",
    faceBiasY: best.untrained ? 16 : 20,
    faceBiasX: STRIP_FACE_X[character.id] ?? 50,
  };
}

/**
 * Vertical band-member strip art — Afterglow-style high-res card CG for every band.
 * Never prefer Q-version standing sprites when card art exists.
 */
export function getCharacterStripArt(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): StripArt {
  const fromCards = pickStripCardArt(character);
  if (fromCards) return fromCards;

  // Curated portrait CG (usually a strong trained/untrained still).
  if (character.portrait) {
    return {
      src: character.portrait,
      kind: "card",
      faceBiasY: 18,
      faceBiasX: STRIP_FACE_X[character.id] ?? 50,
    };
  }

  // Last resort only — Q standing when a character has no card files yet.
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
    faceBiasY: 16,
    faceBiasX: 50,
  };
}
