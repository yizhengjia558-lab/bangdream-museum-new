import type { CardData } from "./data";

export type CardDisplayItem = {
  key: string;
  card: CardData;
  variant: "untrained" | "trained";
  src: string;
};

/** Expand each card into untrained + trained display tiles (trained immediately after untrained). */
export function expandCardDisplays(cards: CardData[]): CardDisplayItem[] {
  const items: CardDisplayItem[] = [];

  for (const card of cards) {
    const untrainedSrc = card.untrained_file || card.untrained_image;
    const trainedSrc = card.trained_file || card.trained_image;

    if (untrainedSrc) {
      items.push({
        key: `${card.id}-untrained`,
        card,
        variant: "untrained",
        src: untrainedSrc,
      });
    }

    if (trainedSrc) {
      items.push({
        key: `${card.id}-trained`,
        card,
        variant: "trained",
        src: trainedSrc,
      });
    }
  }

  return items;
}

/** Match card display tiles by name keyword (case-insensitive). */
export function filterCardDisplaysByName(
  displays: CardDisplayItem[],
  query: string,
  limit = 12
): CardDisplayItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  return displays.filter((item) => item.card.card_name.toLowerCase().includes(q)).slice(0, limit);
}
