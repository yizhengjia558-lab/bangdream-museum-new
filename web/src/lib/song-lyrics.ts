import type { SongData } from "@/lib/data-types";
import type { Locale } from "@/lib/i18n/types";
import { getBandBySlug } from "@/lib/themes";
import { getSongTitle } from "@/lib/songs";

export type LyricLine = {
  time: number;
  text: string;
};

export type SongLyricsResult = {
  source: "lrclib" | "none";
  synced: boolean;
  lines: LyricLine[];
  plain: string;
};

const cache = new Map<string, SongLyricsResult>();

const USER_AGENT = "BanGDreamMuseum/1.0 (https://github.com/yizhengjia558-lab/bangdream-museum-new)";

function emptyResult(): SongLyricsResult {
  return { source: "none", synced: false, lines: [], plain: "" };
}

/** Parse LRC `[mm:ss.xx] text` into timed lines. */
export function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\](.*)/g;
  for (const raw of lrc.split(/\r?\n/)) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null;
    const stamps: number[] = [];
    let text = "";
    let rest = raw;
    while ((match = re.exec(raw))) {
      const m = Number(match[1]);
      const s = Number(match[2]);
      const frac = match[3] || "0";
      const ms = frac.length === 1 ? Number(frac) * 100 : frac.length === 2 ? Number(frac) * 10 : Number(frac);
      stamps.push(m * 60 + s + ms / 1000);
      text = (match[4] || "").trim();
      rest = text;
    }
    if (!stamps.length) continue;
    const cleaned = rest.replace(/^\s+/, "").trim();
    if (!cleaned) continue;
    for (const time of stamps) lines.push({ time, text: cleaned });
  }
  return lines.sort((a, b) => a.time - b.time);
}

function bandArtistNames(song: SongData): string[] {
  const band = song.band_slug ? getBandBySlug(song.band_slug) : undefined;
  const names = new Set<string>();
  if (band) {
    names.add(band.name);
    names.add(band.nameJp);
  }
  names.add("BanG Dream!");
  names.add("BanG Dream! Girls Band Party!");
  return [...names].filter(Boolean);
}

function titleCandidates(song: SongData): string[] {
  const titles = [song.title_en, song.title_jp, song.title_cn, song.title_tw]
    .map((t) => (t || "").trim())
    .filter(Boolean);
  const extras = titles.flatMap((t) => {
    const out = [t];
    if (t.includes("_")) out.push(t.replace(/_/g, " "));
    if (t.includes("！")) out.push(t.replace(/！/g, "!"));
    return out;
  });
  return [...new Set(extras)];
}

type LrcLibHit = {
  id?: number;
  trackName?: string;
  artistName?: string;
  duration?: number;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

function scoreHit(hit: LrcLibHit, duration: number | null): number {
  let score = 0;
  if (hit.syncedLyrics) score += 50;
  else if (hit.plainLyrics) score += 20;
  else return -1;
  if (duration != null && typeof hit.duration === "number") {
    const delta = Math.abs(hit.duration - duration);
    if (delta <= 2) score += 40;
    else if (delta <= 5) score += 25;
    else if (delta <= 12) score += 10;
    else score -= Math.min(30, delta);
  }
  return score;
}

function toResult(hit: LrcLibHit | null): SongLyricsResult {
  if (!hit) return emptyResult();
  if (hit.syncedLyrics) {
    const lines = parseLrc(hit.syncedLyrics);
    if (lines.length) return { source: "lrclib", synced: true, lines, plain: hit.plainLyrics || "" };
  }
  if (hit.plainLyrics) {
    const lines = hit.plainLyrics
      .split(/\r?\n/)
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => ({ time: -1, text }));
    return { source: "lrclib", synced: false, lines, plain: hit.plainLyrics };
  }
  return emptyResult();
}

async function lrclibSearch(params: Record<string, string>): Promise<LrcLibHit[]> {
  const url = `https://lrclib.net/api/search?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) return [];
  const data = (await res.json()) as unknown;
  return Array.isArray(data) ? (data as LrcLibHit[]) : [];
}

async function lrclibGet(params: Record<string, string>): Promise<LrcLibHit | null> {
  const url = `https://lrclib.net/api/get?${new URLSearchParams(params)}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  if (!res.ok) return null;
  return (await res.json()) as LrcLibHit;
}

export async function fetchSongLyrics(song: SongData, locale: Locale): Promise<SongLyricsResult> {
  const cacheKey = `${song.id}:${locale}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const duration = typeof song.length === "number" ? Math.round(song.length) : null;
  const titles = titleCandidates(song);
  const artists = bandArtistNames(song);
  let best: LrcLibHit | null = null;
  let bestScore = -1;

  outer: for (const title of titles.slice(0, 3)) {
    for (const artist of artists.slice(0, 3)) {
      if (duration != null) {
        const exact = await lrclibGet({
          track_name: title,
          artist_name: artist,
          duration: String(duration),
        });
        if (exact) {
          const score = scoreHit(exact, duration);
          if (score > bestScore) {
            best = exact;
            bestScore = score;
          }
          if (exact.syncedLyrics && score >= 80) break outer;
        }
      }

      const hits = await lrclibSearch({ track_name: title, artist_name: artist });
      for (const hit of hits.slice(0, 8)) {
        const score = scoreHit(hit, duration);
        if (score > bestScore) {
          best = hit;
          bestScore = score;
        }
      }
      if (bestScore >= 80) break outer;
    }
  }

  if (bestScore < 15) {
    const q = `${getSongTitle(song, locale)} ${artists[0] || ""}`.trim();
    const hits = await lrclibSearch({ q });
    for (const hit of hits.slice(0, 8)) {
      const score = scoreHit(hit, duration);
      if (score > bestScore) {
        best = hit;
        bestScore = score;
      }
    }
  }

  const result = bestScore >= 15 ? toResult(best) : emptyResult();
  cache.set(cacheKey, result);
  return result;
}

export function activeLyricIndex(lines: LyricLine[], currentTime: number): number {
  if (!lines.length) return -1;
  if (lines[0].time < 0) return -1;
  let idx = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= currentTime + 0.05) idx = i;
    else break;
  }
  return idx;
}
