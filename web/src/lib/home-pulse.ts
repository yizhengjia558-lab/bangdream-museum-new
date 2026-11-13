import "server-only";

import homePulse from "@/data/home-pulse.json";
import { resolveEventBanner } from "@/lib/events";
import { getAllSiteCards, getCharacterSummaries } from "@/lib/data-server";
import type { CardData, CharacterSummary } from "@/lib/data-types";

export type PulseEvent = {
  id: number;
  server: "jp" | "cn" | string;
  name: { zh: string; ja: string; en: string };
  startAt: string;
  endAt: string;
  banner: string;
  eventType?: string;
};

export type PulseBirthday = {
  id: number;
  zh: string;
  ja: string;
  en: string;
  birthday: string;
  member: CharacterSummary;
};

export type PulseServerCard = {
  id: number;
  date: string;
  card: CardData;
};

export type HomePulseData = {
  eventsByServer: {
    cn: PulseEvent[];
    jp: PulseEvent[];
  };
  birthdays: PulseBirthday[];
  recentByServer: {
    cn: PulseServerCard[];
    jp: PulseServerCard[];
  };
};

function normalizeEvent(raw: {
  id: number;
  server: string;
  name: { zh: string; ja: string; en: string };
  startAt: string;
  endAt: string;
  banner?: string | null;
  bannerRemote?: string | null;
  eventType?: string;
}): PulseEvent {
  return {
    id: raw.id,
    server: raw.server,
    name: raw.name,
    startAt: raw.startAt,
    endAt: raw.endAt,
    eventType: raw.eventType,
    banner: resolveEventBanner({
      id: raw.id,
      banner: raw.banner,
      bannerRemote: raw.bannerRemote,
    }),
  };
}

export function getHomePulseData(): HomePulseData {
  const cards = getAllSiteCards();
  const byId = new Map<string, CardData>();
  for (const card of cards) {
    byId.set(String(card.id), card);
    if (card.bestdori_card_id != null) byId.set(String(card.bestdori_card_id), card);
  }

  const members = getCharacterSummaries();
  const memberById = new Map(members.map((m) => [m.id, m]));

  const raw = homePulse as {
    activeByServer?: {
      cn?: Array<Parameters<typeof normalizeEvent>[0]>;
      jp?: Array<Parameters<typeof normalizeEvent>[0]>;
    };
    activeEvents?: Array<Parameters<typeof normalizeEvent>[0]>;
    upcomingBirthdays?: Array<{
      id: number;
      zh: string;
      ja: string;
      en: string;
      birthday?: string | null;
    }>;
    recentByServer?: {
      cn?: Array<{ id: number; date: string }>;
      jp?: Array<{ id: number; date: string }>;
    };
  };

  const eventsByServer = {
    cn: (raw.activeByServer?.cn || []).map(normalizeEvent),
    jp: (raw.activeByServer?.jp || []).map(normalizeEvent),
  };

  // Back-compat if older home-pulse only has flat activeEvents
  if (!eventsByServer.cn.length && !eventsByServer.jp.length && raw.activeEvents?.length) {
    for (const event of raw.activeEvents) {
      const key = event.server === "jp" ? "jp" : "cn";
      eventsByServer[key].push(normalizeEvent(event));
    }
  }

  const birthdays = (raw.upcomingBirthdays || [])
    .map((entry) => {
      const member = memberById.get(entry.id);
      if (!member || !entry.birthday) return null;
      return {
        id: entry.id,
        zh: entry.zh,
        ja: entry.ja,
        en: entry.en,
        birthday: entry.birthday,
        member,
      };
    })
    .filter(Boolean)
    .slice(0, 5) as PulseBirthday[];

  function resolveServer(list: Array<{ id: number; date: string }> = []): PulseServerCard[] {
    return list
      .map((entry) => {
        const card = byId.get(String(entry.id));
        if (!card) return null;
        return { id: entry.id, date: entry.date, card };
      })
      .filter(Boolean)
      .slice(0, 8) as PulseServerCard[];
  }

  return {
    eventsByServer,
    birthdays,
    recentByServer: {
      cn: resolveServer(raw.recentByServer?.cn),
      jp: resolveServer(raw.recentByServer?.jp),
    },
  };
}
