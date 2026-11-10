import type { CardData } from "@/lib/data-types";

const PLACEHOLDER_ID_MIN = 90000;
const MIN_RELEASE_YEAR = 2017;
const MAX_RELEASE_YEAR = 2099;

export function isCatalogCard(card: CardData): boolean {
  const id = Number(card.id);
  return Number.isFinite(id) && id > 0 && id < PLACEHOLDER_ID_MIN;
}

export function parseCardReleaseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  const year = date.getFullYear();
  if (year < MIN_RELEASE_YEAR || year > MAX_RELEASE_YEAR) return null;
  return date;
}

export type RecentCardsResult = {
  cards: CardData[];
  mode: "week" | "latest";
  newestDate: string | null;
};

/** Prefer cards released in the last 7 days; otherwise fall back to the newest arrivals. */
export function selectRecentCards(
  cards: CardData[],
  options: { now?: Date; limit?: number; weekMinCount?: number } = {}
): RecentCardsResult {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 12;
  const weekMinCount = options.weekMinCount ?? 4;
  const graceMs = 2 * 24 * 60 * 60 * 1000;

  const dated = cards
    .filter(isCatalogCard)
    .map((card) => ({ card, date: parseCardReleaseDate(card.release_date) }))
    .filter((entry): entry is { card: CardData; date: Date } => {
      if (!entry.date) return false;
      return entry.date.getTime() <= now.getTime() + graceMs;
    })
    .sort(
      (a, b) =>
        b.date.getTime() - a.date.getTime() || Number(b.card.id) - Number(a.card.id)
    );

  if (!dated.length) {
    return { cards: [], mode: "latest", newestDate: null };
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const weekCards = dated
    .filter((entry) => now.getTime() - entry.date.getTime() <= weekMs)
    .map((entry) => entry.card);

  if (weekCards.length >= weekMinCount) {
    return {
      cards: weekCards.slice(0, limit),
      mode: "week",
      newestDate: weekCards[0]?.release_date || null,
    };
  }

  const latest = dated.slice(0, limit).map((entry) => entry.card);
  return {
    cards: latest,
    mode: "latest",
    newestDate: latest[0]?.release_date || null,
  };
}

/** One entry per costume_id, newest costumes first. */
export function selectCostumeCards(cards: CardData[]): CardData[] {
  const seen = new Set<number>();
  const sorted = cards
    .filter(isCatalogCard)
    .filter((card) => Boolean(card.live2d_asset_bundle_name) && Boolean(card.costume_id))
    .sort(
      (a, b) =>
        (b.costume_id ?? 0) - (a.costume_id ?? 0) || Number(b.id) - Number(a.id)
    );

  const out: CardData[] = [];
  for (const card of sorted) {
    const costumeId = card.costume_id;
    if (costumeId == null || seen.has(costumeId)) continue;
    seen.add(costumeId);
    out.push(card);
  }
  return out;
}

export function costumePreviewSrc(card: CardData): string {
  return card.trained_file || card.trained_image || card.untrained_file || card.untrained_image || "";
}
