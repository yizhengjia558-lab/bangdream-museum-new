import type { CardData, CharacterData, CharacterSummary } from "./data-types";

/** Best card art for blurred character page backdrop */
export function getCharacterBackdrop(character: CharacterData): string {
  return getCharacterPortrait(character);
}

/** Prefer trained card CG; fall back to standing (may be SD for MyGO). */
export function getCharacterPortrait(character: Pick<CharacterSummary, "standing" | "portrait"> & { cards?: CardData[] }): string {
  if (character.portrait) return character.portrait;

  if (character.cards?.length) {
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
  }

  return character.standing;
}
