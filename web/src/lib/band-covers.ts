import type { CharacterData } from "./data";

function cardScore(card: CharacterData["cards"][0]) {
  let s = 0;
  if (card.rarity.includes("5")) s += 50;
  else if (card.rarity.includes("4")) s += 40;
  else if (card.rarity.includes("3")) s += 20;
  if (card.trained_file) s += 35;
  else if (card.untrained_file) s += 15;
  return s;
}

/** Pick the most iconic trained card CG for band showcase backgrounds */
export function getBandCoverImage(members: CharacterData[]): string {
  const allCards = members.flatMap((m) => m.cards);
  const ranked = [...allCards].sort((a, b) => cardScore(b) - cardScore(a));

  for (const card of ranked) {
    if (card.trained_file) return card.trained_file;
  }
  for (const card of ranked) {
    if (card.untrained_file) return card.untrained_file;
  }
  return members[0]?.standing ?? "";
}

export function getBandStats(members: CharacterData[]) {
  const cardCount = members.reduce((n, m) => n + m.card_count, 0);
  return { memberCount: members.length, cardCount };
}
