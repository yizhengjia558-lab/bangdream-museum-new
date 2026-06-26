import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const bandori = path.join(root, "Bandori");
const out = path.join(__dirname, "../src/data/site-data.json");

const index = JSON.parse(fs.readFileSync(path.join(bandori, "all_characters.json"), "utf8"));

function toWebPath(relativePath) {
  const parts = relativePath.replace(/\\/g, "/").split("/").filter(Boolean);
  return `/assets/${parts.map((p) => encodeURIComponent(p)).join("/")}`;
}

/** Append file mtime so browsers pick up replaced PNGs after rebuild. */
function toAssetPath(relativePath) {
  if (!relativePath) return "";
  const abs = path.join(bandori, relativePath.replace(/\//g, path.sep));
  const web = toWebPath(relativePath);
  if (!fs.existsSync(abs)) return web;
  const v = Math.floor(fs.statSync(abs).mtimeMs);
  return `${web}?v=${v}`;
}

function readPngDir(absDir, webPrefix) {
  if (!fs.existsSync(absDir)) return [];
  return fs
    .readdirSync(absDir)
    .filter((f) => f.endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "zh-CN"))
    .map((f) => ({
      file: `${webPrefix}/${encodeURIComponent(f)}`,
      raw: f,
      label: f
        .replace(/_trained\.png$/i, "")
        .replace(/^\d+_/, "")
        .replace(/\.png$/i, ""),
    }));
}

function matchFileByName(files, cardName) {
  if (!cardName || !files.length) return null;
  const normalized = cardName.replace(/\s/g, "").toLowerCase();
  const exact = files.find((f) => f.label.replace(/\s/g, "").toLowerCase() === normalized);
  if (exact) return exact;
  return (
    files.find((f) => {
      const label = f.label.replace(/\s/g, "").toLowerCase();
      return (
        label.includes(normalized.slice(0, Math.min(4, normalized.length))) ||
        normalized.includes(label.slice(0, Math.min(4, label.length)))
      );
    }) || null
  );
}

/** Pair trained file: `123_foo.png` → `123_foo_trained.png` */
function findTrainedPair(trainedFiles, untrainedRaw) {
  if (!untrainedRaw) return "";
  const expected = untrainedRaw.replace(/\.png$/i, "_trained.png");
  const hit = trainedFiles.find((f) => f.raw === expected);
  return hit?.file || "";
}

const characters = index.characters.map((entry) => {
  const metaPath = path.join(bandori, entry.metadata_path.replace(/\//g, path.sep));
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

  const untrainedDir = path.join(bandori, entry.cards_untrained_path.replace(/\//g, path.sep));
  const trainedDir = path.join(bandori, entry.cards_trained_path.replace(/\//g, path.sep));
  const untrainedPrefix = toWebPath(`${entry.path}/Cards/Untrained`);
  const trainedPrefix = toWebPath(`${entry.path}/Cards/Trained`);

  const untrainedFiles = readPngDir(untrainedDir, untrainedPrefix);
  const trainedFiles = readPngDir(trainedDir, trainedPrefix);
  const usedUntrained = new Set();
  const usedTrained = new Set();

  const cards = meta.cards.map((card, idx) => {
    const untrainedEntry = matchFileByName(untrainedFiles, card.card_name);
    let untrained = untrainedEntry?.file || "";
    let trained = untrainedEntry ? findTrainedPair(trainedFiles, untrainedEntry.raw) : "";

    // Trained-only cards (e.g. some KiraFes)
    if (!untrained && (card.trained_image || card.trained_image === "")) {
      const trainedEntry = matchFileByName(trainedFiles, card.card_name);
      if (trainedEntry) trained = trainedEntry.file;
    }

    // Metadata confirms no trained art — don't keep a wrong fuzzy match
    if (untrained && !card.trained_image && !trained) {
      trained = "";
    }

    if (untrained) usedUntrained.add(untrained);
    if (trained) usedTrained.add(trained);

    return {
      id: `${entry.character_id}-${idx}`,
      card_name: card.card_name,
      rarity: card.rarity,
      event: card.event,
      release_date: card.release_date,
      untrained_image: card.untrained_image,
      trained_image: card.trained_image,
      untrained_file: untrained,
      trained_file: trained,
    };
  });

  const galleryUntrained = untrainedFiles
    .filter((f) => !usedUntrained.has(f.file))
    .map((f) => {
      const paired = findTrainedPair(trainedFiles, f.raw);
      if (paired) usedTrained.add(paired);
      return {
        id: `u-${f.raw}`,
        card_name: f.label,
        rarity: "Gallery",
        event: "",
        release_date: "",
        untrained_image: "",
        trained_image: paired ? "paired" : "",
        untrained_file: f.file,
        trained_file: paired,
      };
    });

  const galleryTrained = trainedFiles
    .filter((f) => !usedTrained.has(f.file))
    .map((f) => ({
      id: `t-${f.raw}`,
      card_name: f.label,
      rarity: "Gallery",
      event: "",
      release_date: "",
      untrained_image: "",
      trained_image: "",
      untrained_file: "",
      trained_file: f.file,
    }));

  const allCards = [
    ...cards.filter((c) => c.untrained_file || c.trained_file),
    ...galleryUntrained.filter((c) => c.untrained_file || c.trained_file),
    ...galleryTrained,
  ];

  return {
    id: entry.character_id,
    slug: String(entry.character_id),
    name_cn: meta.character_name_cn,
    name_jp: meta.character_name_jp,
    band: meta.band,
    band_folder: entry.band_folder,
    standing: toAssetPath(entry.standing_path),
    card_count: allCards.length,
    cards: allCards,
  };
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(
  out,
  JSON.stringify({ generated_at: new Date().toISOString(), character_count: characters.length, characters }, null, 2),
  "utf8"
);

const withBoth = characters.reduce(
  (n, c) => n + c.cards.filter((card) => card.untrained_file && card.trained_file).length,
  0
);
console.log(`Wrote ${characters.length} characters, ${characters.reduce((s, c) => s + c.cards.length, 0)} card entries, ${withBoth} with both variants`);
