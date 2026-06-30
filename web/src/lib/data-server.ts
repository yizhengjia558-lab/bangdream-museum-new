import "server-only";

import fs from "fs";
import path from "path";
import siteIndex from "@/data/site-index.json";
import heroCards from "@/data/hero-cards.json";
import homeBands from "@/data/home-bands.json";
import { getBandByFolder, getBandBySlug, type BandTheme } from "./themes";
import type { CardData, CharacterData, CharacterSummary, HomeBandEntry, RiverCardItem } from "./data-types";

const DATA_ROOT = path.join(process.cwd(), "public/data");

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

export function getCharacterSlugs(): string[] {
  return siteIndex.characters.map((character) => character.slug);
}

export function getCharacterSummaries(): CharacterSummary[] {
  return siteIndex.characters as CharacterSummary[];
}

export function getCharacterById(id: string | number): CharacterData | undefined {
  const slug = String(id);
  const file = path.join(DATA_ROOT, "characters", `${slug}.json`);
  if (!fs.existsSync(file)) return undefined;
  return readJson<CharacterData>(file);
}

export function getCharactersByBand(folder: string): CharacterSummary[] {
  return getCharacterSummaries().filter((character) => character.band_folder === folder);
}

export function getBandWithMembers(slug: string): (BandTheme & { members: CharacterData[] }) | undefined {
  const band = getBandBySlug(slug);
  if (!band) return undefined;
  const file = path.join(DATA_ROOT, "bands", `${band.folder}.json`);
  if (!fs.existsSync(file)) return undefined;
  const data = readJson<{ members: CharacterData[] }>(file);
  return { ...band, members: data.members };
}

export function getHeroRiverCards(): RiverCardItem[] {
  return heroCards.items as RiverCardItem[];
}

export function getHomeBandsData(): HomeBandEntry[] {
  return homeBands.bands as HomeBandEntry[];
}

export function getAllSiteCards(): CardData[] {
  const file = path.join(DATA_ROOT, "cards-catalog.json");
  if (!fs.existsSync(file)) return [];
  return readJson<{ cards: CardData[] }>(file).cards;
}

export function getCharacterTheme(character: CharacterSummary) {
  return getBandByFolder(character.band_folder);
}

export { BAND_THEMES, getBandBySlug } from "./themes";
