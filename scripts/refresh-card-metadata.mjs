/**
 * Refresh Bandori metadata.json card names + release dates from Bestdori.
 * Prefers CN title / CN releasedAt so 国服上新 shows correctly on the museum home.
 * Does not re-download images.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BANDORI = path.join(ROOT, "Bandori");
const API = "https://bestdori.com/api/cards/all.5.json";

function walkMetadata(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkMetadata(full, out);
    else if (entry.name === "metadata.json") out.push(full);
  }
  return out;
}

function tsToDate(ts) {
  if (ts == null || ts === "") return "";
  const ms = Number(ts);
  if (!Number.isFinite(ms) || ms <= 0) return "";
  return new Date(ms).toISOString().slice(0, 10);
}

function preferReleaseDate(releasedAt = []) {
  // Bestdori server order: jp, en, tw, cn, kr
  return tsToDate(releasedAt[3]) || tsToDate(releasedAt[0]) || tsToDate(releasedAt[2]) || "";
}

function preferName(prefix = []) {
  return prefix[3] || prefix[2] || prefix[0] || prefix[1] || "";
}

const cards = await fetch(API).then((r) => {
  if (!r.ok) throw new Error(`Bestdori ${r.status}`);
  return r.json();
});

const metas = walkMetadata(BANDORI);
let updatedCards = 0;
let touchedFiles = 0;
const highlights = [];

for (const metaPath of metas) {
  const raw = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  let changed = false;
  for (const card of raw.cards || []) {
    const id = String(card.card_id ?? "");
    const remote = cards[id];
    if (!remote) continue;

    const nextName = preferName(remote.prefix || []);
    const nextDate = preferReleaseDate(remote.releasedAt || []);
    const before = { name: card.card_name, date: card.release_date };

    if (nextName && nextName !== card.card_name) {
      card.card_name = nextName;
      changed = true;
    }
    if (nextDate && nextDate !== card.release_date) {
      card.release_date = nextDate;
      changed = true;
    }

    if (changed && (nextDate >= "2026-11-01" || before.date !== card.release_date)) {
      highlights.push({
        id,
        from: before,
        to: { name: card.card_name, date: card.release_date },
        file: path.relative(ROOT, metaPath),
      });
    }
    if (before.name !== card.card_name || before.date !== card.release_date) updatedCards += 1;
  }

  if (changed) {
    fs.writeFileSync(metaPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
    touchedFiles += 1;
  }
}

console.log(`Updated ${updatedCards} cards across ${touchedFiles} metadata files`);
console.log(
  "Recent highlights:",
  highlights
    .filter((h) => (h.to.date || "") >= "2026-11-01")
    .slice(0, 20)
);
