import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const bandori = path.join(root, "Bandori");
const indexPath = path.join(bandori, "all_characters.json");

const IMAGE_EXT = /\.(png|jpe?g)$/i;

const PROFILES = [
  { name: "card", match: (rel) => rel.includes("/Cards/"), width: 480, quality: 82 },
  { name: "standing", match: (rel) => /\/Standing\//i.test(rel) || /standing/i.test(path.basename(rel)), width: 640, quality: 84 },
  { name: "voice", match: (rel) => rel.includes("/VoiceActor/"), width: 320, quality: 82 },
  { name: "default", match: () => true, width: 720, quality: 82 },
];

function profileFor(relPath) {
  const normalized = relPath.replace(/\\/g, "/");
  return PROFILES.find((profile) => profile.match(normalized)) ?? PROFILES[PROFILES.length - 1];
}

function thumbAbsFor(absPath) {
  const dir = path.dirname(absPath);
  const base = path.basename(absPath).replace(IMAGE_EXT, "");
  return path.join(dir, ".thumbs", `${base}.webp`);
}

function collectImageFiles() {
  const files = new Set();

  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".thumbs") continue;
        walk(abs);
        continue;
      }
      if (IMAGE_EXT.test(entry.name)) files.add(abs);
    }
  }

  walk(bandori);

  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    for (const entry of index.characters ?? []) {
      if (entry.standing_path) {
        const abs = path.join(bandori, entry.standing_path.replace(/\//g, path.sep));
        if (fs.existsSync(abs)) files.add(abs);
      }
    }
  }

  return [...files];
}

function mobileThumbAbsFor(absPath) {
  const dir = path.dirname(absPath);
  const base = path.basename(absPath).replace(IMAGE_EXT, "");
  return path.join(dir, ".thumbs", "m", `${base}.webp`);
}

const MOBILE_WIDTH = 320;
const MOBILE_QUALITY = 78;

async function writeWebp(absPath, outPath, width, quality) {
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  await sharp(absPath)
    .rotate()
    .resize({ width, withoutEnlargement: true })
    .webp({ quality })
    .toFile(outPath);
}

async function ensureThumb(absPath) {
  const rel = path.relative(bandori, absPath);
  const profile = profileFor(rel);
  const thumbAbs = thumbAbsFor(absPath);
  const mobileAbs = mobileThumbAbsFor(absPath);
  const srcMtime = fs.statSync(absPath).mtimeMs;

  let created = 0;

  for (const [outPath, width, quality] of [
    [thumbAbs, profile.width, profile.quality],
    [mobileAbs, Math.min(MOBILE_WIDTH, profile.width), MOBILE_QUALITY],
  ]) {
    if (fs.existsSync(outPath) && fs.statSync(outPath).mtimeMs >= srcMtime) continue;
    await writeWebp(absPath, outPath, width, quality);
    created += 1;
  }

  return { skipped: created === 0 };
}

async function main() {
  if (!fs.existsSync(bandori)) {
    console.log("Bandori folder missing — skip thumbnail generation.");
    return;
  }

  const files = collectImageFiles();
  let created = 0;
  let skipped = 0;
  let failed = 0;

  const batchSize = 8;
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (file) => {
        try {
          return await ensureThumb(file);
        } catch (error) {
          failed += 1;
          console.warn(`Thumb failed: ${path.relative(bandori, file)} — ${error.message}`);
          return null;
        }
      })
    );

    for (const result of results) {
      if (!result) continue;
      if (result.skipped) skipped += 1;
      else created += 1;
    }
  }

  console.log(`Thumbnails: ${created} created, ${skipped} up-to-date, ${failed} failed (${files.length} sources)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
