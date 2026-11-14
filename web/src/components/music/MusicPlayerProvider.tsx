"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { SongData } from "@/lib/data-types";
import {
  loadSongFavorites,
  saveSongFavorites,
  toggleSongFavoriteId,
} from "@/lib/song-favorites";
import { getSongAudioCandidates } from "@/lib/songs";

export type MusicLoopMode = "off" | "one" | "all";

type MusicPlayerContextValue = {
  current: SongData | null;
  queue: SongData[];
  playing: boolean;
  expanded: boolean;
  currentTime: number;
  duration: number;
  loop: MusicLoopMode;
  favoriteIds: number[];
  readyFavorites: boolean;
  playSong: (song: SongData, queue?: SongData[]) => void;
  togglePlay: () => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (seconds: number) => void;
  setExpanded: (open: boolean) => void;
  setLoop: (mode: MusicLoopMode) => void;
  cycleLoop: () => void;
  isSongFavorite: (songId: number) => boolean;
  toggleSongFavorite: (songId: number) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

function nextLoop(mode: MusicLoopMode): MusicLoopMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const candidatesRef = useRef<string[]>([]);
  const candidateIndexRef = useRef(0);
  const queueRef = useRef<SongData[]>([]);
  const currentRef = useRef<SongData | null>(null);
  const loopRef = useRef<MusicLoopMode>("all");
  const playTokenRef = useRef(0);

  const [current, setCurrent] = useState<SongData | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoopState] = useState<MusicLoopMode>("all");
  const [favoriteIds, setFavoriteIds] = useState<number[]>([]);
  const [readyFavorites, setReadyFavorites] = useState(false);

  useEffect(() => {
    currentRef.current = current;
  }, [current]);
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);
  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.setAttribute("referrerpolicy", "no-referrer");
    audioRef.current = audio;

    const onTime = () => setCurrentTime(audio.currentTime || 0);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      const mode = loopRef.current;
      if (mode === "one") {
        audio.currentTime = 0;
        void audio.play().catch(() => setPlaying(false));
        return;
      }
      const list = queueRef.current;
      const song = currentRef.current;
      if (!song || list.length === 0) {
        setPlaying(false);
        return;
      }
      const index = list.findIndex((item) => item.id === song.id);
      if (index >= 0 && index < list.length - 1) {
        void loadAndPlay(list[index + 1], list);
        return;
      }
      if (mode === "all" && list.length > 0) {
        void loadAndPlay(list[0], list);
        return;
      }
      setPlaying(false);
    };
    const onError = () => {
      if (candidateIndexRef.current + 1 < candidatesRef.current.length) {
        candidateIndexRef.current += 1;
        audio.src = candidatesRef.current[candidateIndexRef.current];
        void audio.play().catch(() => setPlaying(false));
        return;
      }
      setPlaying(false);
    };

    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("durationchange", onMeta);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("durationchange", onMeta);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const payload = loadSongFavorites();
    setFavoriteIds(payload.ids);
    setReadyFavorites(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle("music-player-active", Boolean(current));
    document.body.classList.toggle("music-player-expanded", expanded);
    return () => {
      document.body.classList.remove("music-player-active", "music-player-expanded");
    };
  }, [current, expanded]);

  const loadAndPlay = useCallback(async (song: SongData, nextQueue: SongData[]) => {
    const audio = audioRef.current;
    if (!audio) return;
    const token = ++playTokenRef.current;
    const candidates = getSongAudioCandidates(song);
    candidatesRef.current = candidates;
    candidateIndexRef.current = 0;
    setCurrent(song);
    setQueue(nextQueue);
    setCurrentTime(0);
    setDuration(typeof song.length === "number" ? song.length : 0);

    if (!candidates.length) {
      setPlaying(false);
      return;
    }

    audio.src = candidates[0];
    audio.currentTime = 0;
    try {
      await audio.play();
      if (token !== playTokenRef.current) return;
      setPlaying(true);
    } catch {
      if (token !== playTokenRef.current) return;
      setPlaying(false);
    }
  }, []);

  const playSong = useCallback(
    (song: SongData, nextQueue?: SongData[]) => {
      const list =
        nextQueue && nextQueue.length
          ? nextQueue
          : queueRef.current.some((item) => item.id === song.id)
            ? queueRef.current
            : [song];
      if (currentRef.current?.id === song.id && audioRef.current) {
        const audio = audioRef.current;
        if (audio.paused) void audio.play().catch(() => setPlaying(false));
        else audio.pause();
        setQueue(list);
        return;
      }
      void loadAndPlay(song, list);
    },
    [loadAndPlay]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !currentRef.current) return;
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const playNext = useCallback(() => {
    const list = queueRef.current;
    const song = currentRef.current;
    if (!song || list.length === 0) return;
    const index = list.findIndex((item) => item.id === song.id);
    const next = index >= 0 ? list[(index + 1) % list.length] : list[0];
    if (next) void loadAndPlay(next, list);
  }, [loadAndPlay]);

  const playPrev = useCallback(() => {
    const audio = audioRef.current;
    const list = queueRef.current;
    const song = currentRef.current;
    if (!song || !audio) return;
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    if (list.length === 0) return;
    const index = list.findIndex((item) => item.id === song.id);
    const prev = index > 0 ? list[index - 1] : list[list.length - 1];
    if (prev) void loadAndPlay(prev, list);
  }, [loadAndPlay]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(seconds)) return;
    audio.currentTime = Math.max(0, Math.min(seconds, audio.duration || seconds));
    setCurrentTime(audio.currentTime);
  }, []);

  const setLoop = useCallback((mode: MusicLoopMode) => {
    setLoopState(mode);
  }, []);

  const cycleLoop = useCallback(() => {
    setLoopState((mode) => nextLoop(mode));
  }, []);

  const isSongFavorite = useCallback(
    (songId: number) => favoriteIds.includes(songId),
    [favoriteIds]
  );

  const toggleSongFavorite = useCallback((songId: number) => {
    setFavoriteIds((prev) => {
      const nextIds = toggleSongFavoriteId(prev, songId);
      saveSongFavorites({ v: 1, ids: nextIds, updatedAt: Date.now() });
      return nextIds;
    });
  }, []);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      current,
      queue,
      playing,
      expanded,
      currentTime,
      duration,
      loop,
      favoriteIds,
      readyFavorites,
      playSong,
      togglePlay,
      pause,
      playNext,
      playPrev,
      seek,
      setExpanded,
      setLoop,
      cycleLoop,
      isSongFavorite,
      toggleSongFavorite,
    }),
    [
      current,
      queue,
      playing,
      expanded,
      currentTime,
      duration,
      loop,
      favoriteIds,
      readyFavorites,
      playSong,
      togglePlay,
      pause,
      playNext,
      playPrev,
      seek,
      setLoop,
      cycleLoop,
      isSongFavorite,
      toggleSongFavorite,
    ]
  );

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>;
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  return ctx;
}
