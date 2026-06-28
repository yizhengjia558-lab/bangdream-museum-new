import Fuse from "fuse.js";
import type { CardData, CharacterData } from "./data";
import { getAllCharacters } from "./data";
import { BAND_THEMES, getBandByFolder, type BandTheme } from "./themes";

export type SearchableCard = {
  id: string;
  cardName: string;
  memberCn: string;
  memberJp: string;
  band: string;
  bandJp: string;
  cvCn: string;
  cvJp: string;
  cvRomaji: string;
  event: string;
};

export function buildMemberMap(members: CharacterData[] = getAllCharacters()) {
  return new Map(members.map((member) => [member.id, member]));
}

export function toSearchableCard(
  card: CardData,
  memberMap: Map<number, CharacterData>,
  bandCache = new Map<string, BandTheme | undefined>()
): SearchableCard {
  const member = card.character_id ? memberMap.get(card.character_id) : undefined;
  const folder = card.band_folder ?? member?.band_folder ?? "";
  let band = folder ? bandCache.get(folder) : undefined;
  if (folder && band === undefined) {
    band = getBandByFolder(folder);
    bandCache.set(folder, band);
  }

  const va = member?.voice_actor;

  return {
    id: card.id,
    cardName: card.card_name,
    memberCn: card.character_name_cn ?? member?.name_cn ?? "",
    memberJp: card.character_name_jp ?? member?.name_jp ?? "",
    band: card.band ?? member?.band ?? band?.name ?? "",
    bandJp: band?.nameJp ?? "",
    cvCn: va?.cv_cn ?? "",
    cvJp: va?.cv_jp ?? "",
    cvRomaji: va?.cv_romaji ?? "",
    event: card.event ?? "",
  };
}

const CARD_FUSE_KEYS: (keyof SearchableCard)[] = [
  "cardName",
  "memberCn",
  "memberJp",
  "band",
  "bandJp",
  "cvCn",
  "cvJp",
  "cvRomaji",
  "event",
];

export function createCardFuse(cards: CardData[], memberMap: Map<number, CharacterData>) {
  const bandCache = new Map<string, BandTheme | undefined>();
  const items = cards.map((card) => toSearchableCard(card, memberMap, bandCache));
  return new Fuse(items, {
    keys: CARD_FUSE_KEYS,
    threshold: 0.38,
    ignoreLocation: true,
    minMatchCharLength: 1,
  });
}

export function filterCardsBySearch(
  cards: CardData[],
  query: string,
  memberMap: Map<number, CharacterData>
): CardData[] {
  const trimmed = query.trim();
  if (!trimmed) return cards;

  const fuse = createCardFuse(cards, memberMap);
  const matchedIds = new Set(fuse.search(trimmed).map((result) => result.item.id));
  return cards.filter((card) => matchedIds.has(card.id));
}

export type NavSearchHit = {
  type: "band" | "character";
  label: string;
  sublabel: string;
  href: string;
};

let navFuse: Fuse<NavFuseItem> | null = null;

type NavFuseItem = NavSearchHit & {
  keywords: string;
};

function buildNavFuseItems(): NavFuseItem[] {
  const items: NavFuseItem[] = [];

  for (const band of BAND_THEMES) {
    items.push({
      type: "band",
      label: band.name,
      sublabel: band.nameJp,
      href: `/bands/${band.slug}/`,
      keywords: [band.name, band.nameJp, band.id, band.slug].join(" "),
    });
  }

  for (const member of getAllCharacters()) {
    const va = member.voice_actor;
    items.push({
      type: "character",
      label: member.name_cn,
      sublabel: member.name_jp,
      href: `/characters/${member.slug}/`,
      keywords: [
        member.name_cn,
        member.name_jp,
        member.band,
        va?.cv_cn,
        va?.cv_jp,
        va?.cv_romaji,
      ]
        .filter(Boolean)
        .join(" "),
    });
  }

  return items;
}

export function searchNavigation(query: string, limit = 8): NavSearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!navFuse) {
    navFuse = new Fuse(buildNavFuseItems(), {
      keys: ["label", "sublabel", "keywords"],
      threshold: 0.38,
      ignoreLocation: true,
    });
  }

  return navFuse.search(trimmed, { limit }).map((result) => result.item);
}

export function isCardListPath(pathname: string) {
  return (
    pathname.startsWith("/favorites") ||
    /^\/bands\/[^/]+\/?$/.test(pathname) ||
    /^\/characters\/[^/]+\/?$/.test(pathname)
  );
}
