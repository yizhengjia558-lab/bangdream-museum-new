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
import { getSongAudioCandidates, getSongJacketCandidates, getSongTitle } from "@/lib/songs";

export type MusicLoopMode = "off" | "one" | "all";

type MusicPlayerContextValue = {
  current: SongData | null;
  queue: SongData[];
  playing: boolean;
  expanded: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  loop: MusicLoopMode;
  favoriteIds: number[];
  readyFavorites: boolean;
  playSong: (song: SongData, queue?: SongData[]) => void;
  togglePlay: () => void;
  pause: () => void;
  playNext: () => void;
  playPrev: () => void;
  seek: (seconds: number) => void;
  setVolume: (value: number) => void;
  toggleMute: () => void;
  setExpanded: (open: boolean) => void;
  setLoop: (mode: MusicLoopMode) => void;
  cycleLoop: () => void;
  toggleShuffle: () => void;
  removeFromQueue: (songId: number) => void;
  clearQueue: () => void;
  moveInQueue: (from: number, to: number) => void;
  isSongFavorite: (songId: number) => boolean;
  toggleSongFavorite: (songId: number) => void;
};

const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(null);

function nextLoop(mode: MusicLoopMode): MusicLoopMode {
  if (mode === "off") return "all";
  if (mode === "all") return "one";
  return "off";
}

function shuffleList(list: SongData[], currentId?: number | null): SongData[] {
  if (list.length <= 1) return [...list];
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  if (currentId != null) {
    const idx = copy.findIndex((item) => item.id === currentId);
    if (idx > 0) {
      const [item] = copy.splice(idx, 1);
      copy.unshift(item);
    }
  }
  return copy;
}

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const candidatesRef = useRef<string[]>([]);
  const candidateIndexRef = useRef(0);
  const queueRef = useRef<SongData[]>([]);
  const plainQueueRef = useRef<SongData[]>([]);
  const currentRef = useRef<SongData | null>(null);
  const loopRef = useRef<MusicLoopMode>("all");
  const shuffleRef = useRef(false);
  const playTokenRef = useRef(0);
  const volumeRef = useRef(0.9);

  const [current, setCurrent] = useState<SongData | null>(null);
  const [queue, setQueue] = useState<SongData[]>([]);
  const [playing, setPlaying] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
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
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

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

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volumeRef.current;
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
  }, [loadAndPlay]);

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

  const setVolume = useCallback((value: number) => {
    const next = Math.max(0, Math.min(1, value));
    setVolumeState(next);
    setMuted(next === 0);
    if (audioRef.current) {
      audioRef.current.volume = next;
      audioRef.current.muted = next === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.muted || audio.volume === 0) {
      const restore = volumeRef.current > 0 ? volumeRef.current : 0.9;
      audio.muted = false;
      audio.volume = restore;
      setMuted(false);
      setVolumeState(restore);
    } else {
      audio.muted = true;
      setMuted(true);
    }
  }, []);

  // Media Session + keyboard
  useEffect(() => {
    if (!current || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const jacket = getSongJacketCandidates(current)[0];
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: getSongTitle(current, "zh"),
        artist: current.band_slug || "BanG Dream!",
        album: "BanG Dream! Girls Band Party!",
        artwork: jacket
          ? [
              { src: jacket, sizes: "512x512", type: "image/png" },
              { src: jacket, sizes: "256x256", type: "image/png" },
            ]
          : [],
      });
      navigator.mediaSession.playbackState = playing ? "playing" : "paused";
    } catch {
      // unsupported artwork / metadata
    }

    const bind = (
      action: MediaSessionAction,
      handler: MediaSessionActionHandler | null
    ) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // action not supported
      }
    };
    bind("play", () => {
      void audioRef.current?.play().catch(() => setPlaying(false));
    });
    bind("pause", () => audioRef.current?.pause());
    bind("previoustrack", () => playPrev());
    bind("nexttrack", () => playNext());
    bind("seekbackward", () => seek(Math.max(0, (audioRef.current?.currentTime || 0) - 10)));
    bind("seekforward", () =>
      seek(Math.min(duration || 9999, (audioRef.current?.currentTime || 0) + 10))
    );
    bind("seekto", (details) => {
      if (details && typeof details.seekTime === "number") seek(details.seekTime);
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler("play", null);
        navigator.mediaSession.setActionHandler("pause", null);
        navigator.mediaSession.setActionHandler("previoustrack", null);
        navigator.mediaSession.setActionHandler("nexttrack", null);
        navigator.mediaSession.setActionHandler("seekbackward", null);
        navigator.mediaSession.setActionHandler("seekforward", null);
        navigator.mediaSession.setActionHandler("seekto", null);
      } catch {
        // ignore
      }
    };
  }, [current, playing, duration, playNext, playPrev, seek]);

  useEffect(() => {
    if (!current) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }
      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      } else if (event.code === "ArrowRight" && event.shiftKey) {
        event.preventDefault();
        playNext();
      } else if (event.code === "ArrowLeft" && event.shiftKey) {
        event.preventDefault();
        playPrev();
      } else if (event.code === "ArrowRight") {
        event.preventDefault();
        seek((audioRef.current?.currentTime || 0) + 5);
      } else if (event.code === "ArrowLeft") {
        event.preventDefault();
        seek(Math.max(0, (audioRef.current?.currentTime || 0) - 5));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, togglePlay, playNext, playPrev, seek]);

  const playSong = useCallback(
    (song: SongData, nextQueue?: SongData[]) => {
      const base =
        nextQueue && nextQueue.length
          ? nextQueue
          : queueRef.current.some((item) => item.id === song.id)
            ? plainQueueRef.current.length
              ? plainQueueRef.current
              : queueRef.current
            : [song];
      plainQueueRef.current = base;
      const list = shuffleRef.current ? shuffleList(base, song.id) : base;

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

  const setLoop = useCallback((mode: MusicLoopMode) => {
    setLoopState(mode);
  }, []);

  const cycleLoop = useCallback(() => {
    setLoopState((mode) => nextLoop(mode));
  }, []);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      shuffleRef.current = next;
      const plain = plainQueueRef.current.length ? plainQueueRef.current : queueRef.current;
      const song = currentRef.current;
      const list = next ? shuffleList(plain, song?.id) : [...plain];
      setQueue(list);
      return next;
    });
  }, []);

  const removeFromQueue = useCallback(
    (songId: number) => {
      const nextPlain = (plainQueueRef.current.length ? plainQueueRef.current : queueRef.current).filter(
        (song) => song.id !== songId
      );
      plainQueueRef.current = nextPlain;
      const nextQueue = queueRef.current.filter((song) => song.id !== songId);
      setQueue(nextQueue);
      if (currentRef.current?.id === songId) {
        if (nextQueue[0]) void loadAndPlay(nextQueue[0], nextQueue);
        else {
          audioRef.current?.pause();
          setCurrent(null);
          setPlaying(false);
        }
      }
    },
    [loadAndPlay]
  );

  const clearQueue = useCallback(() => {
    plainQueueRef.current = currentRef.current ? [currentRef.current] : [];
    setQueue(plainQueueRef.current);
  }, []);

  const moveInQueue = useCallback((from: number, to: number) => {
    if (from === to || from < 0 || to < 0) return;
    setQueue((prev) => {
      if (from >= prev.length || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      if (!shuffleRef.current) plainQueueRef.current = next;
      return next;
    });
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
      volume,
      muted,
      shuffle,
      loop,
      favoriteIds,
      readyFavorites,
      playSong,
      togglePlay,
      pause,
      playNext,
      playPrev,
      seek,
      setVolume,
      toggleMute,
      setExpanded,
      setLoop,
      cycleLoop,
      toggleShuffle,
      removeFromQueue,
      clearQueue,
      moveInQueue,
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
      volume,
      muted,
      shuffle,
      loop,
      favoriteIds,
      readyFavorites,
      playSong,
      togglePlay,
      pause,
      playNext,
      playPrev,
      seek,
      setVolume,
      toggleMute,
      setLoop,
      cycleLoop,
      toggleShuffle,
      removeFromQueue,
      clearQueue,
      moveInQueue,
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
