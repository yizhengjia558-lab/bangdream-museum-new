/**
 * Build songs catalog + jacket paths from Bestdori all.5 API.
 * Output: web/public/data/songs-catalog.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "../public/data/songs-catalog.json");

/** Bestdori bandId → museum band slug (MyGO folder also includes Ave Mujica). */
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

/** Known jacket package overrides (Bestdori asset quirks). */
const JACKET_PKG_OVERRIDE = {
  13: 30,
  40: 30,
};

function jacketPackageId(songId) {
  if (JACKET_PKG_OVERRIDE[songId] != null) return JACKET_PKG_OVERRIDE[songId];
  return Math.ceil(songId / 10) * 10;
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

async function main() {
  const res = await fetch("https://bestdori.com/api/songs/all.5.json", {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Bestdori songs all.5 HTTP ${res.status}`);
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

    songs.push({
      id,
      band_id: bandId,
      band_slug: BAND_ID_TO_SLUG[bandId] ?? null,
      tag: raw.tag || "other",
      title_jp: pickLocale(titles, 0),
      title_en: pickLocale(titles, 1),
      title_tw: pickLocale(titles, 2),
      title_cn: pickLocale(titles, 3),
      jacket_name: jacketName,
      jacket_path: jacketAssetPath(id, jacketName, "jp"),
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
    source: "https://bestdori.com/api/songs/all.5.json",
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
