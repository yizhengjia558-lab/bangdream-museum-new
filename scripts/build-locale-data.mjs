/**
 * Build locale overlays + home pulse + independent event catalog from Bestdori APIs.
 * - card-locale-names.json
 * - character-locale.json
 * - home-pulse.json
 * - events-catalog.json (+ downloaded banners under web/public/data/events)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "web", "src", "data");
const PUBLIC_EVENTS_DIR = path.join(ROOT, "web", "public", "data", "events");

const CARDS_API = "https://bestdori.com/api/cards/all.5.json";
const CHARS_API = "https://bestdori.com/api/characters/main.2.json";
const CHAR_DETAIL_API = (id) => `https://bestdori.com/api/characters/${id}.json`;
const EVENTS_API = "https://bestdori.com/api/events/all.5.json";
const EVENT_DETAIL_API = (id) => `https://bestdori.com/api/events/${id}.json`;

const SERVERS = [
  { key: "jp", index: 0 },
  { key: "cn", index: 3 },
];

const FETCH_HEADERS = {
  "User-Agent": "BangDream-Museum/1.0 (+locale-build)",
  Accept: "*/*",
};

async function fetchJson(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function fetchPng(url) {
  const res = await fetch(url, { headers: FETCH_HEADERS });
  if (!res.ok) return null;
  const type = res.headers.get("content-type") || "";
  if (type.includes("text/html")) return null;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 8 || buf[0] !== 0x89 || buf[1] !== 0x50) return null;
  return buf;
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

function localizeTriple(names = []) {
  return {
    zh: names[3] || names[2] || names[0] || "",
    ja: names[0] || names[3] || "",
    en: names[1] || names[0] || names[3] || "",
  };
}

function bannerCandidates(detail, serverKey) {
  const bannerName = detail.bannerAssetBundleName;
  const assetName = detail.assetBundleName;
  const idPad = String(detail.id ?? "").padStart(5, "0");
  const list = [];
  if (bannerName) {
    list.push(`https://bestdori.com/assets/${serverKey}/homebanner_rip/${bannerName}.png`);
    list.push(`https://bestdori.com/assets/jp/homebanner_rip/${bannerName}.png`);
  }
  if (assetName) {
    list.push(`https://bestdori.com/assets/${serverKey}/event/${assetName}/images_rip/banner.png`);
    list.push(`https://bestdori.com/assets/jp/event/${assetName}/images_rip/banner.png`);
    list.push(`https://bestdori.com/assets/${serverKey}/event/${assetName}/images_rip/bannerhome.png`);
  }
  if (idPad) {
    list.push(`https://bestdori.com/assets/${serverKey}/event/${idPad}_rip/banner.png`);
    list.push(`https://bestdori.com/assets/jp/event/${idPad}_rip/banner.png`);
  }
  return [...new Set(list)];
}

async function downloadBanner(detail, preferredServer = "jp") {
  const dir = path.join(PUBLIC_EVENTS_DIR, String(detail.id));
  fs.mkdirSync(dir, { recursive: true });
  const outFile = path.join(dir, "banner.png");
  if (fs.existsSync(outFile) && fs.statSync(outFile).size > 1000) {
    return `/data/events/${detail.id}/banner.png`;
  }

  const order = preferredServer === "cn" ? ["cn", "jp"] : ["jp", "cn"];
  for (const server of order) {
    for (const url of bannerCandidates({ ...detail, id: detail.id }, server)) {
      const buf = await fetchPng(url);
      if (!buf) continue;
      fs.writeFileSync(outFile, buf);
      return `/data/events/${detail.id}/banner.png`;
    }
  }
  return null;
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
for (let i = 0; i < charIds.length; i += 8) {
  const chunk = charIds.slice(i, i + 8);
  const settled = await Promise.all(
    chunk.map(async (id) => {
      try {
        return [id, await fetchJson(CHAR_DETAIL_API(id))];
      } catch {
        return [id, null];
      }
    })
  );
  for (const [id, detail] of settled) {
    const info = chars[id];
    const src = detail || info;
    const names = src.characterName || info.characterName;
    characterLocale[id] = {
      zh: names[3] || names[2] || names[0] || "",
      ja: names[0] || names[3] || "",
      en: names[1] || names[0] || "",
      birthday: birthdayToMd(src.profile?.birthday),
      bandId: src.bandId ?? info.bandId ?? null,
    };
  }
}

const now = Date.now();
const DAY = 864e5;

/** Pick event ids worth materializing into the museum catalog. */
const catalogIds = new Set();
for (const [id, ev] of Object.entries(events)) {
  if (id === "0" || !ev) continue;
  let include = false;
  for (const server of SERVERS) {
    const start = Number(ev.startAt?.[server.index] || 0);
    const end = Number(ev.endAt?.[server.index] || 0);
    if (!start || !end) continue;
    // Active, upcoming (30d), or recently ended (120d) — covers CN lag vs JP
    if (now >= start - 30 * DAY && now <= end + 120 * DAY) include = true;
  }
  if (include) catalogIds.add(id);
}

const eventDetails = {};
const idList = [...catalogIds];
for (let i = 0; i < idList.length; i += 6) {
  const chunk = idList.slice(i, i + 6);
  const settled = await Promise.all(
    chunk.map(async (id) => {
      try {
        const detail = await fetchJson(EVENT_DETAIL_API(id));
        return [id, detail];
      } catch {
        return [id, events[id] || null];
      }
    })
  );
  for (const [id, detail] of settled) {
    if (detail) eventDetails[id] = detail;
  }
}

const eventsCatalog = [];
const activeByServer = { jp: [], cn: [] };

for (const id of idList) {
  const summary = events[id];
  const detail = eventDetails[id] || summary;
  if (!detail) continue;

  const names = localizeTriple(detail.eventName || summary.eventName || []);
  const schedules = {};
  for (const server of SERVERS) {
    const start = tsToIso(detail.startAt?.[server.index] ?? summary.startAt?.[server.index]);
    const end = tsToIso(detail.endAt?.[server.index] ?? summary.endAt?.[server.index]);
    if (start && end) schedules[server.key] = { startAt: start, endAt: end };
  }
  if (!schedules.jp && !schedules.cn) continue;

  const preferredServer = schedules.cn && Date.parse(schedules.cn.startAt) <= now && Date.parse(schedules.cn.endAt) >= now
    ? "cn"
    : "jp";
  const bannerLocal = await downloadBanner({ ...detail, id: Number(id) }, preferredServer);
  const bannerRemote = detail.bannerAssetBundleName
    ? `jp/homebanner_rip/${detail.bannerAssetBundleName}.png`
    : detail.assetBundleName
      ? `jp/event/${detail.assetBundleName}/images_rip/banner.png`
      : null;

  const entry = {
    id: Number(id),
    name: names,
    eventType: detail.eventType || summary.eventType || "",
    assetBundleName: detail.assetBundleName || null,
    bannerAssetBundleName: detail.bannerAssetBundleName || null,
    banner: bannerLocal,
    bannerRemote,
    schedules,
    attributes: detail.attributes || [],
    characters: (detail.characters || []).map((c) => ({
      characterId: c.characterId,
      percent: c.percent,
    })),
    rewardCards: detail.rewardCards || [],
    storyCount: Array.isArray(detail.stories) ? detail.stories.length : 0,
    musicCount: Array.isArray(detail.musics) ? detail.musics.length : 0,
  };

  eventsCatalog.push(entry);

  for (const server of SERVERS) {
    const sk = schedules[server.key];
    if (!sk) continue;
    const start = Date.parse(sk.startAt);
    const end = Date.parse(sk.endAt);
    if (now >= start && now <= end) {
      activeByServer[server.key].push({
        id: entry.id,
        server: server.key,
        name: entry.name,
        startAt: sk.startAt,
        endAt: sk.endAt,
        banner: entry.banner,
        bannerRemote: entry.bannerRemote,
        eventType: entry.eventType,
      });
    }
  }
}

eventsCatalog.sort((a, b) => b.id - a.id);
for (const server of SERVERS) {
  activeByServer[server.key].sort((a, b) => a.endAt.localeCompare(b.endAt));
}

const upcomingBirthdays = Object.entries(characterLocale)
  .filter(([, c]) => c.birthday)
  .map(([id, c]) => ({ id: Number(id), ...c }))
  .sort((a, b) => nextBirthdayKey(a.birthday) - nextBirthdayKey(b.birthday))
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
    if (!Number.isFinite(t) || t > now + 2 * DAY) continue;
    if (now - t > 14 * DAY) continue;
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
  path.join(OUT_DIR, "events-catalog.json"),
  `${JSON.stringify({ generated_at: new Date().toISOString(), events: eventsCatalog }, null, 2)}\n`
);
fs.writeFileSync(
  path.join(OUT_DIR, "home-pulse.json"),
  `${JSON.stringify(
    {
      generated_at: new Date().toISOString(),
      activeEvents: [...activeByServer.cn, ...activeByServer.jp],
      activeByServer,
      upcomingBirthdays,
      recentByServer,
    },
    null,
    2
  )}\n`
);

console.log(
  `Locale data: ${Object.keys(cardLocale).length} cards, ${Object.keys(characterLocale).length} chars, ${eventsCatalog.length} events, active jp=${activeByServer.jp.length} cn=${activeByServer.cn.length}`
);
