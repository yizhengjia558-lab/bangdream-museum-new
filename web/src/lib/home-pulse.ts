import "server-only";

import homePulse from "@/data/home-pulse.json";
import { getAllSiteCards, getCharacterSummaries } from "@/lib/data-server";
import type { CardData, CharacterSummary } from "@/lib/data-types";

export type PulseEvent = {
  id: number;
  server: "jp" | "cn" | string;
  name: { zh: string; ja: string; en: string };
  startAt: string;
  endAt: string;
  banner: string;
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
  events: PulseEvent[];
  birthdays: PulseBirthday[];
  recentByServer: {
    cn: PulseServerCard[];
    jp: PulseServerCard[];
  };
};

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
    activeEvents?: PulseEvent[];
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

  const events = (raw.activeEvents || []).filter((e) => e.server === "cn").slice(0, 2);
  const fallbackEvents = events.length ? events : (raw.activeEvents || []).slice(0, 2);

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
    events: fallbackEvents,
    birthdays,
    recentByServer: {
      cn: resolveServer(raw.recentByServer?.cn),
      jp: resolveServer(raw.recentByServer?.jp),
    },
  };
}
