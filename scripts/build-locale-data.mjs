/**
 * Build locale overlays + home pulse data from Bestdori APIs.
 * - card-locale-names.json: zh/ja/en card titles by id
 * - character-locale.json: zh/ja/en names + birthday MM-DD
 * - home-pulse.json: active events + upcoming birthdays
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "web", "src", "data");

const CARDS_API = "https://bestdori.com/api/cards/all.5.json";
const CHARS_API = "https://bestdori.com/api/characters/main.2.json";
const CHAR_DETAIL_API = (id) => `https://bestdori.com/api/characters/${id}.json`;
const EVENTS_API = "https://bestdori.com/api/events/all.5.json";

// Bestdori server index: 0=jp 1=en 2=tw 3=cn 4=kr
const SERVERS = [
  { key: "jp", index: 0 },
  { key: "cn", index: 3 },
];

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

function pickName(prefix = [], prefer = [3, 0, 1, 2]) {
  for (const i of prefer) {
    const v = prefix[i];
    if (v) return v;
  }
  return "";
}

function tsToIso(ts) {
  const n = Number(ts);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n).toISOString();
}

function birthdayToMd(raw) {
  if (raw == null || raw === "") return null;
  // Detail API uses unix-ms timestamp (interpret in JST); older dumps may use MM/DD.
  const asNum = Number(raw);
  if (Number.isFinite(asNum) && asNum > 1e11) {
    const d = new Date(asNum + 9 * 3600 * 1000);
    if (!Number.isNaN(d.getTime())) {
      return `${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    }
  }
  const m = String(raw).match(/(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  return `${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

const [cards, chars, events] = await Promise.all([
  fetchJson(CARDS_API),
  fetchJson(CHARS_API),
  fetchJson(EVENTS_API),
]);

const cardLocale = {};
for (const [id, card] of Object.entries(cards)) {
  if (id === "0" || !card?.prefix) continue;
  const prefix = card.prefix;
  cardLocale[id] = {
    zh: pickName(prefix, [3, 2, 0, 1]),
    ja: pickName(prefix, [0, 3, 1, 2]),
    en: pickName(prefix, [1, 0, 3, 2]),
    releasedAt: {
      jp: tsToIso(card.releasedAt?.[0]),
      cn: tsToIso(card.releasedAt?.[3]),
    },
  };
}

const characterLocale = {};
const charIds = Object.keys(chars).filter((id) => id !== "0" && chars[id]?.characterName);
const detailChunks = [];
for (let i = 0; i < charIds.length; i += 8) {
  detailChunks.push(charIds.slice(i, i + 8));
}
const detailById = {};
for (const chunk of detailChunks) {
  const settled = await Promise.all(
    chunk.map(async (id) => {
      try {
        const detail = await fetchJson(CHAR_DETAIL_API(id));
        return [id, detail];
      } catch {
        return [id, null];
      }
    })
  );
  for (const [id, detail] of settled) {
    if (detail) detailById[id] = detail;
  }
}

for (const id of charIds) {
  const info = chars[id];
  const detail = detailById[id] || info;
  const names = detail.characterName || info.characterName;
  const birthday = birthdayToMd(detail.profile?.birthday ?? info.profile?.birthday);
  characterLocale[id] = {
    zh: names[3] || names[2] || names[0] || "",
    ja: names[0] || names[3] || "",
    en: names[1] || names[0] || "",
    birthday,
    bandId: detail.bandId ?? info.bandId ?? null,
  };
}

const now = Date.now();
const activeEvents = [];
for (const [id, ev] of Object.entries(events)) {
  if (id === "0" || !ev) continue;
  for (const server of SERVERS) {
    const start = Number(ev.startAt?.[server.index] || 0);
    const end = Number(ev.endAt?.[server.index] || 0);
    if (!start || !end) continue;
    if (now < start || now > end) continue;
    const names = ev.eventName || [];
    activeEvents.push({
      id: Number(id),
      server: server.key,
      name: {
        zh: names[3] || names[2] || names[0] || `Event ${id}`,
        ja: names[0] || names[3] || `Event ${id}`,
        en: names[1] || names[0] || `Event ${id}`,
      },
      startAt: new Date(start).toISOString(),
      endAt: new Date(end).toISOString(),
      banner: `https://bestdori.com/assets/${server.key}/event/${String(id).padStart(5, "0")}_rip/banner.png`,
    });
  }
}
activeEvents.sort((a, b) => a.endAt.localeCompare(b.endAt));

const upcomingBirthdays = Object.entries(characterLocale)
  .filter(([, c]) => c.birthday)
  .map(([id, c]) => ({ id: Number(id), ...c }))
  .sort((a, b) => {
    const aKey = nextBirthdayKey(a.birthday);
    const bKey = nextBirthdayKey(b.birthday);
    return aKey - bKey;
  })
  .slice(0, 8);

function nextBirthdayKey(md) {
  const [mm, dd] = md.split("-").map(Number);
  const nowDate = new Date();
  let next = new Date(Date.UTC(nowDate.getUTCFullYear(), mm - 1, dd));
  const today = new Date(Date.UTC(nowDate.getUTCFullYear(), nowDate.getUTCMonth(), nowDate.getUTCDate()));
  if (next < today) next = new Date(Date.UTC(nowDate.getUTCFullYear() + 1, mm - 1, dd));
  return next.getTime();
}

const recentByServer = { jp: [], cn: [] };
for (const [id, meta] of Object.entries(cardLocale)) {
  for (const server of SERVERS) {
    const iso = meta.releasedAt[server.key];
    if (!iso) continue;
    const t = Date.parse(iso);
    if (!Number.isFinite(t) || t > now + 2 * 864e5) continue;
    if (now - t > 14 * 864e5) continue;
    recentByServer[server.key].push({
      id: Number(id),
      date: iso.slice(0, 10),
      name: meta,
    });
  }
}
for (const server of SERVERS) {
  recentByServer[server.key].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  recentByServer[server.key] = recentByServer[server.key].slice(0, 16);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, "card-locale-names.json"), `${JSON.stringify(cardLocale)}\n`);
fs.writeFileSync(path.join(OUT_DIR, "character-locale.json"), `${JSON.stringify(characterLocale, null, 2)}\n`);
fs.writeFileSync(
  path.join(OUT_DIR, "home-pulse.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      activeEvents: activeEvents.slice(0, 6),
      upcomingBirthdays,
      recentByServer,
    },
    null,
    2
  )}\n`
);

console.log(
  `Locale data: ${Object.keys(cardLocale).length} cards, ${Object.keys(characterLocale).length} chars, ${activeEvents.length} active events`
);
