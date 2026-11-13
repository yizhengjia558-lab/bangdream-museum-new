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

/**
 * Vertical band-member strip art: prioritize face-visible framing.
 * Prefer untrained / mid-rarity busts (faces usually upper-center), then
 * standing sprites, then any remaining card CG / portrait.
 */
export function getCharacterStripArt(
  character: Pick<CharacterSummary, "id" | "standing" | "portrait"> & { cards?: CardData[] }
): { src: string; kind: "standing" | "card"; faceBias: number } {
  if (character.cards?.length) {
    const ranked = [...character.cards]
      .map((card) => {
        const untrained = card.untrained_file || card.untrained_image;
        const trained = card.trained_file || card.trained_image;
        const src = untrained || trained;
        if (!src) return null;

        const starMatch = card.rarity.match(/([1-5])/);
        const stars = card.stars ?? (starMatch ? Number(starMatch[1]) : 0);
        let score = 0;
        // Untrained art is usually a closer bust with the face in frame.
        if (untrained) score += 40;
        if (stars === 2) score += 28;
        else if (stars === 3) score += 24;
        else if (stars === 4) score += 12;
        else if (stars === 1) score += 18;
        else if (stars === 5) score -= 8;
        // Trained scenic CGs often crop to torso / props in a tall strip.
        if (!untrained && trained) score -= 18;
        return { src, score, untrained: Boolean(untrained) };
      })
      .filter(Boolean) as { src: string; score: number; untrained: boolean }[];

    ranked.sort((a, b) => b.score - a.score);
    if (ranked[0] && ranked[0].score >= 20) {
      return {
        src: ranked[0].src,
        kind: "card",
        faceBias: ranked[0].untrained ? 14 : 18,
      };
    }
  }

  if (character.standing) {
    return { src: character.standing, kind: "standing", faceBias: 8 };
  }

  if (character.cards?.length) {
    const any =
      character.cards
        .map((c) => c.untrained_file || c.untrained_image || c.trained_file || c.trained_image)
        .find(Boolean) || "";
    if (any) return { src: any, kind: "card", faceBias: 16 };
  }

  if (character.portrait) return { src: character.portrait, kind: "card", faceBias: 16 };
  return { src: character.standing || "", kind: "standing", faceBias: 8 };
}
