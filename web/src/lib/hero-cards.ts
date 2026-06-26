import { getAllCharacters, getCharactersByBand } from "./data";
import type { CardData } from "./data";
import { BAND_THEMES } from "./themes";

export type RiverCardItem = {
  src: string;
  band: string;
};

function cardScore(card: CardData) {
  let s = 0;
  if (card.rarity.includes("5")) s += 50;
  if (card.rarity.includes("4")) s += 35;
  if (card.trained_file) s += 20;
  if (card.untrained_file) s += 10;
  return s;
}

/** Sample iconic card art from every band for the hero Card River */
export function getHeroRiverCards(perBand = 10): RiverCardItem[] {
  const items: RiverCardItem[] = [];

  for (const band of BAND_THEMES) {
    const members = getCharactersByBand(band.folder);
    const bandCards = members
      .flatMap((m) => m.cards)
      .filter((c) => c.trained_file || c.untrained_file)
      .sort((a, b) => cardScore(b) - cardScore(a));

    const picked = new Set<string>();
    for (const card of bandCards) {
      if (picked.size >= perBand) break;
      const src = card.trained_file || card.untrained_file;
      if (!src || picked.has(src)) continue;
      picked.add(src);
      items.push({ src, band: band.name });
    }
  }

  if (items.length >= 24) return items;

  // Fallback: any remaining high-rarity cards
  const extra = getAllCharacters()
    .flatMap((c) =>
      c.cards.map((card) => ({
        src: card.trained_file || card.untrained_file,
        band: c.band,
        score: cardScore(card),
      }))
    )
    .filter((c) => c.src)
    .sort((a, b) => b.score - a.score);

  for (const c of extra) {
    if (items.length >= 56) break;
    if (items.some((i) => i.src === c.src)) continue;
    items.push({ src: c.src, band: c.band });
  }

  return items;
}
