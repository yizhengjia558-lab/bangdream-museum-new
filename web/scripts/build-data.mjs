import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const bandori = path.join(root, "Bandori");
const indexOut = path.join(__dirname, "../src/data/site-index.json");
const heroCardsOut = path.join(__dirname, "../src/data/hero-cards.json");
const homeBandsOut = path.join(__dirname, "../src/data/home-bands.json");
const publicDataRoot = path.join(__dirname, "../public/data");
const charactersOutDir = path.join(publicDataRoot, "characters");
const bandsOutDir = path.join(publicDataRoot, "bands");
const cardsCatalogOut = path.join(publicDataRoot, "cards-catalog.json");

const BAND_SLUG_BY_FOLDER = {
  PoppinParty: "poppin-party",
  Afterglow: "afterglow",
  PastelPalettes: "pastel-palettes",
  Roselia: "roselia",
  HelloHappyWorld: "hello-happy-world",
  Morfonica: "morfonica",
  RaiseASuilen: "raise-a-suilen",
  // MyGO!!!!! + Ave Mujica share Bestdori cards — single museum folder
  MyGO: "mygo",
};
const enrichmentScript = path.join(root, "scripts/build-card-enrichment.py");
const enrichmentPath = path.join(__dirname, "../src/data/card-enrichment.json");

spawnSync("python", [enrichmentScript], { cwd: root, stdio: "inherit" });

const enrichmentRaw = fs.existsSync(enrichmentPath)
  ? JSON.parse(fs.readFileSync(enrichmentPath, "utf8"))
  : { cards: {} };

function normCardName(name) {
  return (name || "").replace(/\s+/g, "").toLowerCase();
}

function enrichCardFields(card, entry, meta) {
  const key = `${entry.character_id}|${normCardName(card.card_name)}`;
  const extra = enrichmentRaw.cards?.[key] || {};
  const releaseYear = extra.release_year ?? (card.release_date ? parseInt(card.release_date.slice(0, 4), 10) : null);
  return {
    ...card,
    character_id: entry.character_id,
    character_name_cn: meta.character_name_cn,
    character_name_jp: meta.character_name_jp,
    band: meta.band,
    band_folder: entry.band_folder,
    stars: extra.stars ?? null,
    attribute: extra.attribute || "",
    card_kind: extra.card_kind || "normal",
    release_year: Number.isFinite(releaseYear) ? releaseYear : null,
    bestdori_card_id: extra.bestdori_card_id ?? card.bestdori_card_id ?? null,
    costume_id: extra.costume_id ?? null,
    sd_resource_name: extra.sd_resource_name ?? null,
    live2d_asset_bundle_name: extra.live2d_asset_bundle_name ?? null,
    animation_asset_bundle_name: extra.animation_asset_bundle_name ?? null,
    bestdori_type: extra.bestdori_type ?? null,
  };
}

const index = JSON.parse(fs.readFileSync(path.join(bandori, "all_characters.json"), "utf8"));
const voiceActorsPath = path.join(__dirname, "../src/data/voice-actors.json");
const voiceActorsRaw = fs.existsSync(voiceActorsPath)
  ? JSON.parse(fs.readFileSync(voiceActorsPath, "utf8"))
  : {};

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

function normalizeLabel(name) {
  return (name || "").replace(/[_\s]+/g, "").toLowerCase();
}

function parseCardIdFromMeta(card) {
  if (card.card_id != null && Number.isFinite(Number(card.card_id))) {
    return String(card.card_id);
  }
  const m = /^(?:card|カード)\s*(\d+)$/i.exec((card.card_name || "").trim());
  return m ? m[1] : null;
}

function parseCardIdFromRaw(raw) {
  const m = /^(\d+)_/.exec(raw || "");
  return m ? m[1] : null;
}

/** Prefer card_id filename prefix, then exact name. Avoid vague fuzzy matches. */
function matchCardFile(files, card, used) {
  const available = files.filter((f) => !used.has(f.file));
  if (!available.length) return null;

  const cardId = parseCardIdFromMeta(card);
  if (cardId) {
    const byId = available.find((f) => parseCardIdFromRaw(f.raw) === cardId);
    if (byId) return byId;
  }

  const normalized = normalizeLabel(card.card_name);
  if (!normalized || normalized.startsWith("card")) return null;

  const exact = available.find((f) => normalizeLabel(f.label) === normalized);
  if (exact) return exact;

  // Conservative fuzzy: only unique candidate where one side fully contains the other (≥4 chars)
  if (normalized.length < 4) return null;
  const fuzzy = available.filter((f) => {
    const label = normalizeLabel(f.label);
    if (!label || label.startsWith("card") || label.length < 4) return false;
    return label.includes(normalized) || normalized.includes(label);
  });
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

function markFilesWithCardId(files, cardId, used) {
  if (!cardId) return;
  for (const f of files) {
    if (parseCardIdFromRaw(f.raw) === cardId) used.add(f.file);
  }
}

/** Pair trained file: `123_foo.png` → `123_foo_trained.png` */
function findTrainedPair(trainedFiles, untrainedRaw, used) {
  if (!untrainedRaw) return "";
  const expected = untrainedRaw.replace(/\.png$/i, "_trained.png");
  const hit = trainedFiles.find((f) => f.raw === expected && !used.has(f.file));
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
    const untrainedEntry = matchCardFile(untrainedFiles, card, usedUntrained);
    let untrained = untrainedEntry?.file || "";
    let trained = untrainedEntry ? findTrainedPair(trainedFiles, untrainedEntry.raw, usedTrained) : "";

    // Trained-only cards (e.g. some KiraFes / birthday)
    if (!untrained) {
      const trainedEntry = matchCardFile(trainedFiles, card, usedTrained);
      if (trainedEntry) trained = trainedEntry.file;
    }

    // Metadata confirms no trained art — don't keep a wrong fuzzy match
    if (untrained && !card.trained_image && !trained) {
      trained = "";
    }

    if (untrained) usedUntrained.add(untrained);
    if (trained) usedTrained.add(trained);

    // Same Bestdori card_id may have both JP-named and CN-named PNG copies — claim all
    const fileCardId =
      parseCardIdFromMeta(card) ||
      (untrainedEntry ? parseCardIdFromRaw(untrainedEntry.raw) : null) ||
      (trained ? parseCardIdFromRaw(trainedFiles.find((f) => f.file === trained)?.raw || "") : null);
    markFilesWithCardId(untrainedFiles, fileCardId, usedUntrained);
    markFilesWithCardId(trainedFiles, fileCardId, usedTrained);

    return enrichCardFields(
      {
        id: card.card_id != null ? String(card.card_id) : `${entry.character_id}-${idx}`,
        card_name: card.card_name,
        rarity: card.rarity,
        event: card.event,
        release_date: card.release_date,
        untrained_image: card.untrained_image,
        trained_image: card.trained_image,
        untrained_file: untrained,
        trained_file: trained,
        bestdori_card_id: card.card_id ?? null,
      },
      entry,
      meta
    );
  });

  const galleryUntrained = untrainedFiles
    .filter((f) => !usedUntrained.has(f.file))
    .map((f) => {
      const paired = findTrainedPair(trainedFiles, f.raw, usedTrained);
      if (paired) usedTrained.add(paired);
      return enrichCardFields(
        {
          id: `u-${f.raw}`,
          card_name: f.label,
          rarity: "Gallery",
          event: "",
          release_date: "",
          untrained_image: "",
          trained_image: paired ? "paired" : "",
          untrained_file: f.file,
          trained_file: paired,
        },
        entry,
        meta
      );
    });

  const galleryTrained = trainedFiles
    .filter((f) => !usedTrained.has(f.file))
    .map((f) =>
      enrichCardFields(
        {
          id: `t-${f.raw}`,
          card_name: f.label,
          rarity: "Gallery",
          event: "",
          release_date: "",
          untrained_image: "",
          trained_image: "",
          untrained_file: "",
          trained_file: f.file,
        },
        entry,
        meta
      )
    );

  const allCards = [
    ...cards.filter((c) => c.untrained_file || c.trained_file),
    ...galleryUntrained.filter((c) => c.untrained_file || c.trained_file),
    ...galleryTrained,
  ];

  // Same display name on one character (reprints / JP+CN file copies) — keep both but disambiguate
  const seenNames = new Map();
  for (const card of allCards) {
    const key = normalizeLabel(card.card_name);
    if (!key) continue;
    if (!seenNames.has(key)) {
      seenNames.set(key, card);
      continue;
    }
    const suffix = card.bestdori_card_id || String(card.id || "").replace(/^u-(\d+).*/, "$1");
    if (suffix && !String(card.card_name).includes(`(#${suffix})`)) {
      card.card_name = `${card.card_name} (#${suffix})`;
    }
  }

  const vaMeta = voiceActorsRaw[String(entry.character_id)];

  /** Prefer per-character VoiceActor/ folder; fall back to voice-actors.json path. */
  function resolveVoiceActorImage() {
    const vaDir = path.join(bandori, entry.path.replace(/\//g, path.sep), "VoiceActor");
    if (fs.existsSync(vaDir)) {
      const preferred = ["cv.jpg", "cv.png", "cv.webp", "cv.jpeg"];
      for (const name of preferred) {
        const abs = path.join(vaDir, name);
        if (fs.existsSync(abs)) return toAssetPath(`${entry.path}/VoiceActor/${name}`);
      }
      const any = fs
        .readdirSync(vaDir)
        .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
        .sort()[0];
      if (any) return toAssetPath(`${entry.path}/VoiceActor/${any}`);
    }
    if (vaMeta?.image) return toAssetPath(vaMeta.image);
    return "";
  }

  const vaImage = resolveVoiceActorImage();
  const voice_actor =
    vaImage || vaMeta
      ? {
          cv_jp: vaMeta?.cv_jp || "",
          cv_romaji: vaMeta?.cv_romaji || "",
          cv_cn: vaMeta?.cv_cn || "",
          image: vaImage,
        }
      : undefined;

  const standing = toAssetPath(entry.standing_path);
  const portrait = pickPortraitImage(allCards, standing);

  return {
    id: entry.character_id,
    slug: String(entry.character_id),
    name_cn: meta.character_name_cn,
    name_jp: meta.character_name_jp,
    band: meta.band,
    band_folder: entry.band_folder,
    standing,
    portrait,
    card_count: allCards.length,
    cards: allCards,
    ...(voice_actor ? { voice_actor } : {}),
  };
});

function cardScore(card) {
  let s = 0;
  if (card.rarity.includes("5")) s += 50;
  if (card.rarity.includes("4")) s += 35;
  if (card.trained_file) s += 20;
  if (card.untrained_file) s += 10;
  return s;
}

/** Prefer trained card CG for member grid / hero (avoids MyGO SD standing sprites). */
function pickPortraitImage(cards, standing) {
  const ranked = [...cards].sort((a, b) => cardScore(b) - cardScore(a));
  for (const card of ranked) {
    if (card.trained_file) return card.trained_file;
  }
  for (const card of ranked) {
    if (card.untrained_file) return card.untrained_file;
  }
  return standing || "";
}

function toSummary(character) {
  const { cards: _cards, ...summary } = character;
  return summary;
}

function pickBandCoverImage(members) {
  const allCards = members.flatMap((m) => m.cards);
  const ranked = [...allCards].sort((a, b) => cardScore(b) - cardScore(a));
  for (const card of ranked) {
    if (card.trained_file) return card.trained_file;
  }
  for (const card of ranked) {
    if (card.untrained_file) return card.untrained_file;
  }
  return members[0]?.standing ?? "";
}

function buildHeroRiverCards(perBand = 6) {
  const items = [];
  const folders = Object.keys(BAND_SLUG_BY_FOLDER);

  for (const folder of folders) {
    const members = characters.filter((c) => c.band_folder === folder);
    const bandCards = members
      .flatMap((m) => m.cards)
      .filter((c) => c.trained_file || c.untrained_file)
      .sort((a, b) => cardScore(b) - cardScore(a));

    const picked = new Set();
    for (const card of bandCards) {
      if (picked.size >= perBand) break;
      const src = card.trained_file || card.untrained_file;
      if (!src || picked.has(src)) continue;
      picked.add(src);
      items.push({ src, band: card.band ?? members[0]?.band ?? folder });
    }
  }

  if (items.length >= 24) return items;

  const extra = characters
    .flatMap((c) =>
      c.cards.map((card) => ({
        src: card.trained_file || card.untrained_file,
        band: c.band,
        score: cardScore(card),
      }))
    )
    .filter((c) => c.src)
    .sort((a, b) => b.score - a.score);

  for (const c of extra) {
    if (items.length >= 40) break;
    if (items.some((i) => i.src === c.src)) continue;
    items.push({ src: c.src, band: c.band });
  }

  return items;
}

const summaries = characters.map(toSummary);
const cardsCatalog = characters.flatMap((character) =>
  character.cards.map((card) => ({
    ...card,
    character_id: card.character_id ?? character.id,
    character_name_cn: card.character_name_cn ?? character.name_cn,
    character_name_jp: card.character_name_jp ?? character.name_jp,
    band: card.band ?? character.band,
    band_folder: card.band_folder ?? character.band_folder,
  }))
);

const homeBands = Object.entries(BAND_SLUG_BY_FOLDER).map(([folder, slug]) => {
  const members = characters.filter((c) => c.band_folder === folder);
  return {
    slug,
    folder,
    coverImage: pickBandCoverImage(members),
    memberCount: members.length,
    cardCount: members.reduce((n, m) => n + m.card_count, 0),
    representative: members[0] ? toSummary(members[0]) : null,
  };
});

const generatedAt = new Date().toISOString();

fs.mkdirSync(path.dirname(indexOut), { recursive: true });
fs.mkdirSync(charactersOutDir, { recursive: true });
fs.mkdirSync(bandsOutDir, { recursive: true });

fs.writeFileSync(
  indexOut,
  JSON.stringify({ generated_at: generatedAt, character_count: summaries.length, characters: summaries }),
  "utf8"
);

fs.writeFileSync(
  heroCardsOut,
  JSON.stringify({ generated_at: generatedAt, items: buildHeroRiverCards(4) }),
  "utf8"
);

fs.writeFileSync(
  homeBandsOut,
  JSON.stringify({ generated_at: generatedAt, bands: homeBands }),
  "utf8"
);

for (const character of characters) {
  fs.writeFileSync(
    path.join(charactersOutDir, `${character.slug}.json`),
    JSON.stringify(character),
    "utf8"
  );
}

for (const [folder] of Object.entries(BAND_SLUG_BY_FOLDER)) {
  const members = characters.filter((c) => c.band_folder === folder);
  fs.writeFileSync(path.join(bandsOutDir, `${folder}.json`), JSON.stringify({ members }), "utf8");
}

fs.writeFileSync(
  cardsCatalogOut,
  JSON.stringify({ generated_at: generatedAt, cards: cardsCatalog }),
  "utf8"
);

const withBoth = characters.reduce(
  (n, c) => n + c.cards.filter((card) => card.untrained_file && card.trained_file).length,
  0
);
console.log(
  `Wrote index (${summaries.length} chars), ${cardsCatalog.length} catalog cards, ${withBoth} with both variants`
);
