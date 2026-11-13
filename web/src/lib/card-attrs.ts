import type { CardAttribute, CardData } from "@/lib/data-types";

export const ATTR_COLORS: Record<Exclude<CardAttribute, "">, string> = {
  power: "#e9435e",
  cool: "#4f7cff",
  pure: "#3ecf8e",
  happy: "#ffb02e",
};

export function getCardAttrColor(attribute: CardData["attribute"] | null | undefined) {
  if (!attribute) return null;
  return ATTR_COLORS[attribute] ?? null;
}

export function getCardStarCount(card: CardData) {
  if (typeof card.stars === "number" && card.stars > 0) return Math.min(5, card.stars);
  const match = String(card.rarity || "").match(/(\d)/);
  if (match) return Math.min(5, Number(match[1]));
  return 0;
}
