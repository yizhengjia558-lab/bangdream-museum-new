"use client";

import { useEffect, useMemo, type CSSProperties } from "react";
import { SongJacketImage } from "@/components/music/SongJacketImage";
import { useMusicPlayer } from "@/components/music/MusicPlayerProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { getBandName } from "@/lib/i18n/display";
import { formatSongTime, getSongAltTitle, getSongTitle, resolveSongBand } from "@/lib/songs";
import { cn } from "@/lib/utils";

function LoopIcon({ mode }: { mode: "off" | "one" | "all" }) {
  if (mode === "one") return <span aria-hidden>1↻</span>;
  if (mode === "all") return <span aria-hidden>↻</span>;
  return <span aria-hidden>→</span>;
}

export function MusicPlayerDock() {
  const { t, locale } = useLocale();
  const {
    current,
    playing,
    expanded,
    currentTime,
    duration,
    loop,
    togglePlay,
    playNext,
    playPrev,
    seek,
    setExpanded,
    cycleLoop,
    isSongFavorite,
    toggleSongFavorite,
    queue,
  } = useMusicPlayer();

  useEffect(() => {
    if (!expanded) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded, setExpanded]);

  const band = useMemo(() => (current ? resolveSongBand(current) : undefined), [current]);
  const accent = band?.colors.primary ?? "#e9435e";
  const title = current ? getSongTitle(current, locale) : "";
  const alt = current ? getSongAltTitle(current, locale) : "";
  const bandName = band ? getBandName(band, locale) : "";
  const liked = current ? isSongFavorite(current.id) : false;
  const progressMax = duration > 0 ? duration : current?.length || 0;
  const progressValue = Math.min(currentTime, progressMax || currentTime);

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
            className={cn("music-player-mini__btn", liked && "is-active")}
            aria-label={liked ? t("music.unfavorite") : t("music.favorite")}
            onClick={() => toggleSongFavorite(current.id)}
          >
            {liked ? "♥" : "♡"}
          </button>
          <button
            type="button"
            className="music-player-mini__btn music-player-mini__btn--play"
            aria-label={playing ? t("music.pause") : t("music.play")}
            onClick={togglePlay}
          >
            {playing ? "❚❚" : "▶"}
          </button>
        </div>
        <div className="music-player-mini__progress" aria-hidden>
          <span
            style={{
              width: progressMax > 0 ? `${(progressValue / progressMax) * 100}%` : "0%",
            }}
          />
        </div>
      </div>

      {expanded ? (
        <div className="music-player-sheet" style={style} role="dialog" aria-modal="true">
          <div className="music-player-sheet__backdrop" onClick={() => setExpanded(false)} />
          <div className="music-player-sheet__panel">
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

            <div className="music-player-sheet__art-wrap">
              <div className={cn("music-player-sheet__art", playing && "is-playing")}>
                <SongJacketImage song={current} alt={title} priority />
              </div>
            </div>

            <div className="music-player-sheet__info">
              <h2 className="music-player-sheet__title">{title}</h2>
              <p className="music-player-sheet__sub">
                {[bandName, alt].filter(Boolean).join(" · ") || t("music.playerNowPlaying")}
              </p>
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

            <div className="music-player-sheet__controls">
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
              <span className="music-player-sheet__side music-player-sheet__queue" aria-hidden>
                {queue.length || 1}
              </span>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
