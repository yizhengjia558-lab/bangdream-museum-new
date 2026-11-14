"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { SongJacketImage } from "@/components/music/SongJacketImage";
import { useMusicPlayer } from "@/components/music/MusicPlayerProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName } from "@/lib/i18n/display";
import {
  activeLyricIndex,
  fetchSongLyrics,
  type SongLyricsResult,
} from "@/lib/song-lyrics";
import {
  formatSongTime,
  getSongAltTitle,
  getSongCredit,
  getSongTitle,
  resolveSongBand,
} from "@/lib/songs";
import { cn } from "@/lib/utils";

function LoopIcon({ mode }: { mode: "off" | "one" | "all" }) {
  if (mode === "one") return <span aria-hidden>1↻</span>;
  if (mode === "all") return <span aria-hidden>↻</span>;
  return <span aria-hidden>→</span>;
}

type SheetTab = "lyrics" | "queue";

export function MusicPlayerDock() {
  const { t, locale } = useLocale();
  const {
    current,
    playing,
    expanded,
    currentTime,
    duration,
    volume,
    muted,
    shuffle,
    loop,
    queue,
    playSong,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setVolume,
    toggleMute,
    setExpanded,
    cycleLoop,
    toggleShuffle,
    removeFromQueue,
    moveInQueue,
    isSongFavorite,
    toggleSongFavorite,
  } = useMusicPlayer();

  const [tab, setTab] = useState<SheetTab>("lyrics");
  const [lyrics, setLyrics] = useState<SongLyricsResult | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);
  const lyricRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const dragIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  useEffect(() => {
    if (!current) {
      setLyrics(null);
      return;
    }
    let cancelled = false;
    setLyricsLoading(true);
    setLyrics(null);
    fetchSongLyrics(current, locale)
      .then((result) => {
        if (!cancelled) setLyrics(result);
      })
      .catch(() => {
        if (!cancelled) setLyrics({ source: "none", synced: false, lines: [], plain: "" });
      })
      .finally(() => {
        if (!cancelled) setLyricsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [current, locale]);

  const band = useMemo(() => (current ? resolveSongBand(current) : undefined), [current]);
  const accent = band?.colors.primary ?? "#e9435e";
  const title = current ? getSongTitle(current, locale) : "";
  const alt = current ? getSongAltTitle(current, locale) : "";
  const bandName = band ? getBandName(band, locale) : "";
  const liked = current ? isSongFavorite(current.id) : false;
  const progressMax = duration > 0 ? duration : current?.length || 0;
  const progressValue = Math.min(currentTime, progressMax || currentTime);
  const lyricIdx = lyrics?.synced ? activeLyricIndex(lyrics.lines, currentTime) : -1;
  const composer = current ? getSongCredit(current, "composer", locale) : "";
  const lyricist = current ? getSongCredit(current, "lyricist", locale) : "";
  const arranger = current ? getSongCredit(current, "arranger", locale) : "";

  useEffect(() => {
    if (!expanded || lyricIdx < 0) return;
    lyricRefs.current[lyricIdx]?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [lyricIdx, expanded]);

  if (!current) return null;

  const style = { ["--player-accent" as string]: accent } as CSSProperties;

  return (
    <>
      <div
        className={cn("music-player-mini", expanded && "music-player-mini--hidden")}
        style={style}
        role="region"
        aria-label={t("music.playerNowPlaying")}
      >
        <button
          type="button"
          className="music-player-mini__art"
          onClick={() => setExpanded(true)}
          aria-label={t("music.playerExpand")}
        >
          <SongJacketImage song={current} alt={title} />
        </button>
        <button
          type="button"
          className="music-player-mini__meta"
          onClick={() => setExpanded(true)}
        >
          <span className="music-player-mini__title">{title}</span>
          <span className="music-player-mini__sub">
            {bandName || alt || t("music.playerNowPlaying")}
          </span>
        </button>
        <div className="music-player-mini__controls">
          <button
            type="button"
            className="music-player-mini__btn"
            aria-label={t("music.prev")}
            onClick={playPrev}
          >
            ⏮
          </button>
          <button
            type="button"
            className="music-player-mini__btn music-player-mini__btn--play"
            aria-label={playing ? t("music.pause") : t("music.play")}
            onClick={togglePlay}
          >
            {playing ? "❚❚" : "▶"}
          </button>
          <button
            type="button"
            className="music-player-mini__btn"
            aria-label={t("music.next")}
            onClick={playNext}
          >
            ⏭
          </button>
          <button
            type="button"
            className={cn("music-player-mini__btn", liked && "is-active")}
            aria-label={liked ? t("music.unfavorite") : t("music.favorite")}
            onClick={() => toggleSongFavorite(current.id)}
          >
            {liked ? "♥" : "♡"}
          </button>
        </div>
        <label className="music-player-mini__seek">
          <span className="sr-only">{t("music.playerSeek")}</span>
          <input
            type="range"
            min={0}
            max={progressMax || 1}
            step={0.1}
            value={progressValue}
            onChange={(event) => seek(Number(event.target.value))}
          />
        </label>
      </div>

      {expanded ? (
        <div className="music-player-sheet" style={style} role="dialog" aria-modal="true">
          <div className="music-player-sheet__backdrop" onClick={() => setExpanded(false)} />
          <div className="music-player-sheet__panel music-player-sheet__panel--spotify">
            <div className="music-player-sheet__top">
              <button
                type="button"
                className="music-player-sheet__chevron"
                onClick={() => setExpanded(false)}
                aria-label={t("music.playerCollapse")}
              >
                ⌄
              </button>
              <div className="music-player-sheet__eyebrow">
                <span>{t("music.playerNowPlaying")}</span>
                {bandName ? <strong>{bandName}</strong> : null}
              </div>
              <button
                type="button"
                className={cn("music-player-sheet__heart", liked && "is-active")}
                aria-label={liked ? t("music.unfavorite") : t("music.favorite")}
                onClick={() => toggleSongFavorite(current.id)}
              >
                {liked ? "♥" : "♡"}
              </button>
            </div>

            <div className="music-player-sheet__stage">
              <div className="music-player-sheet__stage-art">
                <div className={cn("music-player-sheet__art", playing && "is-playing")}>
                  <SongJacketImage song={current} alt={title} priority />
                </div>
                <div className="music-player-sheet__info">
                  <h2 className="music-player-sheet__title">{title}</h2>
                  <p className="music-player-sheet__sub">
                    {[bandName, alt].filter(Boolean).join(" · ") || t("music.playerNowPlaying")}
                  </p>
                  {(composer || lyricist || arranger) && (
                    <p className="music-player-sheet__credits">
                      {[
                        lyricist ? `${t("music.lyricist")}: ${lyricist}` : null,
                        composer ? `${t("music.composer")}: ${composer}` : null,
                        arranger ? `${t("music.arranger")}: ${arranger}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="music-player-sheet__stage-side">
                <div className="music-player-sheet__tabs" role="tablist">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "lyrics"}
                    className={cn(tab === "lyrics" && "is-active")}
                    onClick={() => setTab("lyrics")}
                  >
                    {t("music.lyrics")}
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={tab === "queue"}
                    className={cn(tab === "queue" && "is-active")}
                    onClick={() => setTab("queue")}
                  >
                    {t("music.queue")} ({queue.length})
                  </button>
                </div>

                {tab === "lyrics" ? (
                  <div className="music-player-lyrics" role="tabpanel">
                    {lyricsLoading ? (
                      <p className="music-player-lyrics__empty">{t("music.lyricsLoading")}</p>
                    ) : !lyrics || lyrics.source === "none" || lyrics.lines.length === 0 ? (
                      <div className="music-player-lyrics__empty">
                        <p>{t("music.lyricsMissing")}</p>
                        {(composer || lyricist) && (
                          <p className="music-player-lyrics__fallback">
                            {[lyricist, composer].filter(Boolean).join(" / ")}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className={cn("music-player-lyrics__list", lyrics.synced && "is-synced")}>
                        {lyrics.lines.map((line, index) => (
                          <button
                            key={`${line.time}-${index}`}
                            type="button"
                            ref={(node) => {
                              lyricRefs.current[index] = node;
                            }}
                            className={cn(
                              "music-player-lyrics__line",
                              lyrics.synced && index === lyricIdx && "is-active",
                              lyrics.synced && index < lyricIdx && "is-passed"
                            )}
                            onClick={() => {
                              if (line.time >= 0) seek(line.time);
                            }}
                          >
                            {line.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="music-player-queue" role="tabpanel">
                    {queue.map((song, index) => {
                      const qTitle = getSongTitle(song, locale);
                      const qBand = resolveSongBand(song);
                      const active = song.id === current.id;
                      return (
                        <div
                          key={`${song.id}-${index}`}
                          className={cn("music-player-queue__row", active && "is-active")}
                          draggable
                          onDragStart={() => {
                            dragIndex.current = index;
                          }}
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={() => {
                            if (dragIndex.current == null) return;
                            moveInQueue(dragIndex.current, index);
                            dragIndex.current = null;
                          }}
                        >
                          <button
                            type="button"
                            className="music-player-queue__main"
                            onClick={() => playSong(song, queue)}
                          >
                            <span className="music-player-queue__index">
                              {active && playing ? "♪" : index + 1}
                            </span>
                            <span className="music-player-queue__meta">
                              <strong>{qTitle}</strong>
                              <em>{qBand ? getBandName(qBand, locale) : "—"}</em>
                            </span>
                          </button>
                          <button
                            type="button"
                            className="music-player-queue__remove"
                            aria-label={t("music.queueRemove")}
                            onClick={() => removeFromQueue(song.id)}
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="music-player-sheet__seek">
              <input
                type="range"
                min={0}
                max={progressMax || 1}
                step={0.1}
                value={progressValue}
                aria-label={t("music.playerSeek")}
                onChange={(event) => seek(Number(event.target.value))}
              />
              <div className="music-player-sheet__times">
                <span>{formatSongTime(progressValue)}</span>
                <span>{formatSongTime(progressMax)}</span>
              </div>
            </div>

            <div className="music-player-sheet__controls music-player-sheet__controls--rich">
              <button
                type="button"
                className={cn("music-player-sheet__side", shuffle && "is-active")}
                onClick={toggleShuffle}
                aria-label={t("music.shuffle")}
                aria-pressed={shuffle}
              >
                ⇄
              </button>
              <button
                type="button"
                className="music-player-sheet__skip"
                onClick={playPrev}
                aria-label={t("music.prev")}
              >
                ⏮
              </button>
              <button
                type="button"
                className="music-player-sheet__play"
                onClick={togglePlay}
                aria-label={playing ? t("music.pause") : t("music.play")}
              >
                {playing ? "❚❚" : "▶"}
              </button>
              <button
                type="button"
                className="music-player-sheet__skip"
                onClick={playNext}
                aria-label={t("music.next")}
              >
                ⏭
              </button>
              <button
                type="button"
                className={cn("music-player-sheet__side", loop !== "off" && "is-active")}
                onClick={cycleLoop}
                aria-label={t("music.playerLoop")}
                title={
                  loop === "one"
                    ? t("music.loopOne")
                    : loop === "all"
                      ? t("music.loopAll")
                      : t("music.loopOff")
                }
              >
                <LoopIcon mode={loop} />
              </button>
            </div>

            <div className="music-player-sheet__volume">
              <button type="button" onClick={toggleMute} aria-label={t("music.volume")}>
                {muted || volume === 0 ? "×♪" : "♪"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                aria-label={t("music.volume")}
                onChange={(event) => setVolume(Number(event.target.value))}
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
