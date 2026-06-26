import type { CardData, CharacterData } from "./data";

/** Best card art for blurred character page backdrop */
export function getCharacterBackdrop(character: CharacterData): string {
  const ranked = [...character.cards].sort((a, b) => {
    const score = (c: CardData) => {
      if (c.rarity.includes("5")) return 5;
      if (c.rarity.includes("4")) return 4;
      if (c.rarity.includes("3")) return 3;
      return 1;
    };
    return score(b) - score(a);
  });

  for (const card of ranked) {
    if (card.trained_file) return card.trained_file;
    if (card.untrained_file) return card.untrained_file;
  }
  return character.standing;
}
