import "server-only";

import eventsCatalog from "@/data/events-catalog.json";
import { getAllSiteCards, getCharacterSummaries } from "@/lib/data-server";
import type { CardData, CharacterSummary } from "@/lib/data-types";

export type EventSchedule = { startAt: string; endAt: string };

export type EventCatalogEntry = {
  id: number;
  name: { zh: string; ja: string; en: string };
  eventType: string;
  assetBundleName?: string | null;
  bannerAssetBundleName?: string | null;
  banner?: string | null;
  bannerRemote?: string | null;
  schedules: {
    jp?: EventSchedule;
    cn?: EventSchedule;
  };
  attributes: Array<{ attribute: string; percent: number }>;
  characters: Array<{ characterId: number; percent: number }>;
  rewardCards: number[];
  storyCount: number;
  musicCount: number;
};

export type ResolvedEvent = EventCatalogEntry & {
  members: Array<{ member: CharacterSummary; percent: number }>;
  rewardCardItems: CardData[];
};

function catalog(): EventCatalogEntry[] {
  return ((eventsCatalog as { events?: EventCatalogEntry[] }).events || []) as EventCatalogEntry[];
}

export function getEventIds(): string[] {
  return catalog().map((e) => String(e.id));
}

function withResolvedBanner(event: EventCatalogEntry): EventCatalogEntry {
  return {
    ...event,
    banner: resolveEventBanner(event) || event.banner || null,
  };
}

export function getAllEvents(): EventCatalogEntry[] {
  return catalog().map(withResolvedBanner);
}

export function getEventById(id: string | number): EventCatalogEntry | undefined {
  const n = Number(id);
  const event = catalog().find((e) => e.id === n);
  return event ? withResolvedBanner(event) : undefined;
}

export function resolveEvent(id: string | number): ResolvedEvent | undefined {
  const event = getEventById(id);
  if (!event) return undefined;

  const members = getCharacterSummaries();
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const cards = getAllSiteCards();
  const byId = new Map<string, CardData>();
  for (const card of cards) {
    byId.set(String(card.id), card);
    if (card.bestdori_card_id != null) byId.set(String(card.bestdori_card_id), card);
  }

  return {
    ...event,
    members: event.characters
      .map((c) => {
        const member = memberMap.get(c.characterId);
        if (!member) return null;
        return { member, percent: c.percent };
      })
      .filter(Boolean) as Array<{ member: CharacterSummary; percent: number }>,
    rewardCardItems: event.rewardCards.map((cid) => byId.get(String(cid))).filter(Boolean) as CardData[],
  };
}

export function getEventsForServer(server: "jp" | "cn", mode: "active" | "all" = "all"): EventCatalogEntry[] {
  const now = Date.now();
  return catalog()
    .filter((event) => {
      const sk = event.schedules[server];
      if (!sk) return false;
      if (mode !== "active") return true;
      const start = Date.parse(sk.startAt);
      const end = Date.parse(sk.endAt);
      return now >= start && now <= end;
    })
    .sort((a, b) => {
      const aEnd = a.schedules[server]?.endAt || "";
      const bEnd = b.schedules[server]?.endAt || "";
      return bEnd.localeCompare(aEnd);
    });
}

export function resolveEventBanner(event: Pick<EventCatalogEntry, "banner" | "bannerRemote" | "id">): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";
  if (event.banner) return `${basePath}${event.banner}`;
  if (event.bannerRemote) return `${basePath}/bestdori-assets/${event.bannerRemote}`;
  return "";
}
