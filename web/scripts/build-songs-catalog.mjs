/**
 * Build songs catalog + jacket/audio/meta from Bestdori all.8 API.
 * Output: web/public/data/songs-catalog.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../public/data/songs-catalog.json");
const SOURCE = "https://bestdori.com/api/songs/all.8.json";

const BAND_ID_TO_SLUG = {
  1: "poppin-party",
  2: "afterglow",
  3: "hello-happy-world",
  4: "pastel-palettes",
  5: "roselia",
  18: "raise-a-suilen",
  21: "morfonica",
  45: "mygo",
  46: "mygo",
};

const JACKET_PKG_OVERRIDE = {
  13: 30,
  40: 30,
};

const ASSET_REGION_OVERRIDE = {
  273: "cn",
};

function jacketPackageId(songId) {
  if (JACKET_PKG_OVERRIDE[songId] != null) return JACKET_PKG_OVERRIDE[songId];
  return Math.ceil(songId / 10) * 10;
}

function assetRegion(songId) {
  if (ASSET_REGION_OVERRIDE[songId]) return ASSET_REGION_OVERRIDE[songId];
  if (songId >= 10000) return "cn";
  return "jp";
}

function songBgmId(songId) {
  return `bgm${String(songId).padStart(3, "0")}`;
}

function pickLocale(arr, index, fallback = "") {
  if (!Array.isArray(arr)) return fallback;
  return arr[index] || arr[0] || fallback;
}

function jacketAssetPath(songId, jacketName, region = "jp") {
  const pkg = jacketPackageId(songId);
  const name = String(jacketName || "").toLowerCase();
  return `${region}/musicjacket/musicjacket${pkg}_rip/assets-star-forassetbundle-startapp-musicjacket-musicjacket${pkg}-${name}-jacket.png`;
}

function firstPublishedMs(publishedAt) {
  if (!Array.isArray(publishedAt)) return null;
  for (const raw of publishedAt) {
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/** Prefer Expert BPM map entry, then any difficulty. */
function extractBpm(bpm) {
  if (bpm == null) return null;
  if (typeof bpm === "number" && Number.isFinite(bpm)) return bpm;
  if (Array.isArray(bpm)) {
    for (const entry of bpm) {
      const n = Number(entry?.bpm ?? entry);
      if (Number.isFinite(n) && n > 0) return n;
    }
    return null;
  }
  if (typeof bpm === "object") {
    for (const key of ["3", "2", "1", "0", "4"]) {
      const lane = bpm[key];
      if (!Array.isArray(lane) || !lane.length) continue;
      const n = Number(lane[0]?.bpm);
      if (Number.isFinite(n) && n > 0) return n;
    }
    for (const lane of Object.values(bpm)) {
      if (!Array.isArray(lane) || !lane.length) continue;
      const n = Number(lane[0]?.bpm);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

async function main() {
  const res = await fetch(SOURCE, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Bestdori songs all.8 HTTP ${res.status}`);
  const all = await res.json();

  const songs = [];
  for (const [idStr, raw] of Object.entries(all)) {
    const id = Number(idStr);
    if (!Number.isFinite(id) || !raw) continue;

    const jackets = Array.isArray(raw.jacketImage)
      ? raw.jacketImage.filter(Boolean)
      : raw.jacketImage
        ? [raw.jacketImage]
        : [];
    const jacketName = jackets.length ? jackets[jackets.length - 1] : null;
    if (!jacketName) continue;

    const bandId = Number(raw.bandId) || 0;
    const titles = raw.musicTitle || [];
    const diffs = raw.difficulty || {};
    const region = assetRegion(id);
    const bgmId = songBgmId(id);
    const lengthSec = Number(raw.length);
    const bpm = extractBpm(raw.bpm);

    songs.push({
      id,
      band_id: bandId,
      band_slug: BAND_ID_TO_SLUG[bandId] ?? null,
      tag: raw.tag || "other",
      title_jp: pickLocale(titles, 0),
      title_en: pickLocale(titles, 1),
      title_tw: pickLocale(titles, 2),
      title_cn: pickLocale(titles, 3),
      lyricist_jp: pickLocale(raw.lyricist, 0),
      lyricist_en: pickLocale(raw.lyricist, 1),
      lyricist_cn: pickLocale(raw.lyricist, 3),
      composer_jp: pickLocale(raw.composer, 0),
      composer_en: pickLocale(raw.composer, 1),
      composer_cn: pickLocale(raw.composer, 3),
      arranger_jp: pickLocale(raw.arranger, 0),
      arranger_en: pickLocale(raw.arranger, 1),
      arranger_cn: pickLocale(raw.arranger, 3),
      jacket_name: jacketName,
      jacket_region: region,
      jacket_path: jacketAssetPath(id, jacketName, region),
      bgm_id: bgmId,
      audio_region: region,
      length: Number.isFinite(lengthSec) && lengthSec > 0 ? lengthSec : null,
      bpm,
      published_at: firstPublishedMs(raw.publishedAt),
      difficulty: {
        easy: diffs["0"]?.playLevel ?? null,
        normal: diffs["1"]?.playLevel ?? null,
        hard: diffs["2"]?.playLevel ?? null,
        expert: diffs["3"]?.playLevel ?? null,
        special: diffs["4"]?.playLevel ?? null,
      },
    });
  }

  songs.sort((a, b) => {
    const pa = a.published_at ?? 0;
    const pb = b.published_at ?? 0;
    if (pb !== pa) return pb - pa;
    return b.id - a.id;
  });

  const payload = {
    generated_at: new Date().toISOString(),
    source: SOURCE,
    count: songs.length,
    songs,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload) + "\n", "utf8");
  console.log(`[build-songs] Wrote ${songs.length} songs → ${outPath}`);
}

main().catch((err) => {
  console.error("[build-songs] failed:", err);
  process.exit(1);
});
