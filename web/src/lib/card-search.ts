import Fuse from "fuse.js";
import siteIndex from "@/data/site-index.json";
import { getBandName, getCharacterName } from "@/lib/i18n/display";
import type { Locale } from "@/lib/i18n/types";
import type { CardData, CharacterSummary } from "./data-types";
import { BAND_THEMES, getBandByFolder, type BandTheme } from "./themes";

export type SearchableCard = {
  id: string;
  cardName: string;
  memberCn: string;
  memberJp: string;
  memberEn: string;
  band: string;
  bandJp: string;
  cvCn: string;
  cvJp: string;
  cvRomaji: string;
  event: string;
};

export function buildMemberMap(members: CharacterSummary[] = siteIndex.characters as CharacterSummary[]) {
  return new Map(members.map((member) => [member.id, member]));
}

export function toSearchableCard(
  card: CardData,
  memberMap: Map<number, CharacterSummary>,
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
    cardName: [card.card_name, card.card_name_jp, card.card_name_en].filter(Boolean).join(" "),
    memberCn: card.character_name_cn ?? member?.name_cn ?? "",
    memberJp: card.character_name_jp ?? member?.name_jp ?? "",
    memberEn: card.character_name_en ?? member?.name_en ?? "",
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
  "memberEn",
  "band",
  "bandJp",
  "cvCn",
  "cvJp",
  "cvRomaji",
  "event",
];

export function createCardFuse(cards: CardData[], memberMap: Map<number, CharacterSummary>) {
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
  memberMap: Map<number, CharacterSummary>
): CardData[] {
  const trimmed = query.trim();
  if (!trimmed) return cards;

  const fuse = createCardFuse(cards, memberMap);
  const matchedIds = new Set(fuse.search(trimmed).map((result) => result.item.id));
  return cards.filter((card) => matchedIds.has(card.id));
}

export type NavSearchHit = {
  type: "band" | "character" | "page";
  label: string;
  sublabel: string;
  href: string;
  /** Optional thumb: character portrait path or band logo id. */
  thumb?: string;
  thumbKind?: "image" | "band-logo";
  bandSlug?: string;
  memberId?: number;
};

let navFuse: Fuse<NavFuseItem> | null = null;

type NavFuseItem = NavSearchHit & {
  keywords: string;
};

function buildNavFuseItems(): NavFuseItem[] {
  const items: NavFuseItem[] = [
    {
      type: "page",
      label: "社区论坛",
      sublabel: "Forum",
      href: "/forum/",
      keywords: "社区 论坛 forum community コミュニティ",
    },
    {
      type: "page",
      label: "服装 / Live2D 图鉴",
      sublabel: "Costumes",
      href: "/costumes/",
      keywords: "服装 衣装 costume live2d 图鉴 図鑑 gallery 衣装図鑑",
    },
    {
      type: "page",
      label: "活动一览",
      sublabel: "Events",
      href: "/events/",
      keywords: "活动 イベント event events 国服 日服",
    },
  ];

  for (const band of BAND_THEMES) {
    items.push({
      type: "band",
      label: band.name,
      sublabel: band.nameJp,
      href: `/bands/${band.slug}/`,
      keywords: [band.name, band.nameJp, band.id, band.slug].join(" "),
      thumbKind: "band-logo",
      bandSlug: band.slug,
    });
  }

  for (const member of siteIndex.characters as CharacterSummary[]) {
    const va = member.voice_actor;
    items.push({
      type: "character",
      label: member.name_cn,
      sublabel: member.name_jp,
      href: `/characters/${member.slug}/`,
      keywords: [
        member.name_cn,
        member.name_jp,
        member.name_en,
        member.band,
        va?.cv_cn,
        va?.cv_jp,
        va?.cv_romaji,
      ]
        .filter(Boolean)
        .join(" "),
      thumb: member.portrait || member.standing || "",
      thumbKind: "image",
      memberId: member.id,
    });
  }

  return items;
}

export function searchNavigation(query: string, limit = 8, locale: Locale = "zh"): NavSearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (!navFuse) {
    navFuse = new Fuse(buildNavFuseItems(), {
      keys: ["label", "sublabel", "keywords"],
      threshold: 0.38,
      ignoreLocation: true,
    });
  }

  const members = siteIndex.characters as CharacterSummary[];
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return navFuse.search(trimmed, { limit }).map((result) => {
    const hit = result.item;
    if (hit.type === "band" && hit.bandSlug) {
      const band = BAND_THEMES.find((b) => b.slug === hit.bandSlug);
      if (band) {
        return {
          ...hit,
          label: getBandName(band, locale),
          sublabel: locale === "ja" ? band.name : band.nameJp,
        };
      }
    }
    if (hit.type === "character" && hit.memberId != null) {
      const member = memberMap.get(hit.memberId);
      if (member) {
        return {
          ...hit,
          label: getCharacterName(member, locale),
          sublabel:
            locale === "zh"
              ? member.name_jp
              : locale === "ja"
                ? member.name_cn
                : member.name_jp || member.name_cn,
        };
      }
    }
    if (hit.type === "page") {
      if (hit.href.includes("forum")) {
        return {
          ...hit,
          label: locale === "ja" ? "コミュニティ" : locale === "en" ? "Forum" : "社区论坛",
          sublabel: locale === "en" ? "Community" : "Forum",
        };
      }
      if (hit.href.includes("costumes")) {
        return {
          ...hit,
          label:
            locale === "ja"
              ? "衣装 / Live2D 図鑑"
              : locale === "en"
                ? "Costume / Live2D Gallery"
                : "服装 / Live2D 图鉴",
          sublabel: locale === "ja" ? "衣装" : "Costumes",
        };
      }
      if (hit.href.includes("events")) {
        return {
          ...hit,
          label: locale === "ja" ? "イベント一覧" : locale === "en" ? "Events" : "活动一览",
          sublabel: locale === "ja" ? "イベント" : "Events",
        };
      }
    }
    return hit;
  });
}

export function isCardListPath(pathname: string) {
  return (
    pathname.startsWith("/favorites") ||
    pathname.startsWith("/costumes") ||
    /^\/bands\/[^/]+\/?$/.test(pathname) ||
    /^\/characters\/[^/]+\/?$/.test(pathname)
  );
}
