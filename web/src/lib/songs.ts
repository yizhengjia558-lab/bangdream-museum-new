import { getSongJacketDirectUrl } from "@/lib/bestdori-assets";
import type { SongData } from "@/lib/data-types";
import type { Locale } from "@/lib/i18n/types";
import { getBandBySlug, type BandTheme } from "@/lib/themes";

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

export function getSongJacketUrl(song: SongData): string {
  if (song.jacket_name) {
    return getSongJacketDirectUrl(song.id, song.jacket_name, "jp");
  }
  return "";
}

export function resolveSongBand(song: SongData): BandTheme | undefined {
  if (!song.band_slug) return undefined;
  return getBandBySlug(song.band_slug);
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
