import { getSongJacketDirectUrl, type BestdoriRegion } from "@/lib/bestdori-assets";
import type { SongData } from "@/lib/data-types";
import type { Locale } from "@/lib/i18n/types";
import { getBandBySlug, type BandTheme } from "@/lib/themes";

export type SongTagFilter = "all" | "normal" | "anime" | "tie_up";
export type SongExpertFilter = "all" | "le20" | "21to25" | "ge26";
export type SongSort = "newest" | "oldest" | "title";

export function getSongTitle(song: SongData, locale: Locale): string {
  if (locale === "ja") return song.title_jp || song.title_en || song.title_cn;
  if (locale === "en") return song.title_en || song.title_jp || song.title_cn;
  return song.title_cn || song.title_jp || song.title_en;
}

export function getSongAltTitle(song: SongData, locale: Locale): string {
  const primary = getSongTitle(song, locale);
  const jp = song.title_jp;
  if (locale !== "ja" && jp && jp !== primary) return jp;
  if (locale === "ja" && song.title_en && song.title_en !== primary) return song.title_en;
  return "";
}

function preferredJacketRegion(song: SongData): BestdoriRegion {
  const region = (song.jacket_region || "").toLowerCase();
  if (region === "cn" || region === "en" || region === "tw" || region === "kr") {
    return region;
  }
  if (song.id >= 10000 || song.id === 273) return "cn";
  return "jp";
}

export function getSongJacketUrl(song: SongData, region?: BestdoriRegion): string {
  if (!song.jacket_name) return "";
  return getSongJacketDirectUrl(song.id, song.jacket_name, region ?? preferredJacketRegion(song));
}

/** Primary + fallback CDN URLs for jackets that only exist on some servers. */
export function getSongJacketCandidates(song: SongData): string[] {
  if (!song.jacket_name) return [];
  const primary = preferredJacketRegion(song);
  const order = [primary, "jp", "cn", "en", "tw", "kr"].filter(
    (region, index, all) => all.indexOf(region) === index
  ) as BestdoriRegion[];
  return order.map((region) => getSongJacketDirectUrl(song.id, song.jacket_name, region));
}

export function resolveSongBand(song: SongData): BandTheme | undefined {
  if (!song.band_slug) return undefined;
  return getBandBySlug(song.band_slug);
}

export function getSongYear(song: SongData): number | null {
  if (!song.published_at) return null;
  const year = new Date(song.published_at).getUTCFullYear();
  return Number.isFinite(year) ? year : null;
}

export function collectSongYears(songs: SongData[]): number[] {
  const years = new Set<number>();
  for (const song of songs) {
    const year = getSongYear(song);
    if (year != null) years.add(year);
  }
  return [...years].sort((a, b) => b - a);
}

export function filterSongsByBand(songs: SongData[], bandSlug: string | null): SongData[] {
  if (!bandSlug) return songs;
  return songs.filter((song) => song.band_slug === bandSlug);
}

export function filterSongsByQuery(songs: SongData[], query: string): SongData[] {
  const q = query.trim().toLowerCase();
  if (!q) return songs;
  return songs.filter((song) => {
    const blob = [
      song.title_jp,
      song.title_en,
      song.title_cn,
      song.title_tw,
      song.jacket_name,
      song.tag,
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

export function filterSongsByYear(songs: SongData[], year: number | null): SongData[] {
  if (year == null) return songs;
  return songs.filter((song) => getSongYear(song) === year);
}

export function filterSongsByTag(songs: SongData[], tag: SongTagFilter): SongData[] {
  if (tag === "all") return songs;
  return songs.filter((song) => song.tag === tag);
}

export function filterSongsByExpert(songs: SongData[], expert: SongExpertFilter): SongData[] {
  if (expert === "all") return songs;
  return songs.filter((song) => {
    const level = song.difficulty?.expert;
    if (typeof level !== "number") return false;
    if (expert === "le20") return level <= 20;
    if (expert === "21to25") return level >= 21 && level <= 25;
    return level >= 26;
  });
}

export function sortSongs(songs: SongData[], sort: SongSort, locale: Locale): SongData[] {
  const next = [...songs];
  if (sort === "title") {
    next.sort((a, b) => getSongTitle(a, locale).localeCompare(getSongTitle(b, locale), locale));
    return next;
  }
  next.sort((a, b) => {
    const pa = a.published_at ?? 0;
    const pb = b.published_at ?? 0;
    if (pa !== pb) return sort === "newest" ? pb - pa : pa - pb;
    return sort === "newest" ? b.id - a.id : a.id - b.id;
  });
  return next;
}
