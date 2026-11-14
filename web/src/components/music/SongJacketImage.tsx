"use client";

import { useEffect, useState } from "react";
import type { SongData } from "@/lib/data-types";
import { getSongJacketCandidates } from "@/lib/songs";
import { cn } from "@/lib/utils";

/** Tries JP/CN/… jacket CDNs until one loads. */
export function SongJacketImage({
  song,
  alt,
  className,
  priority = false,
}: {
  song: SongData;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const candidates = getSongJacketCandidates(song);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = !failed && candidates[index] ? candidates[index] : "";

  useEffect(() => {
    setIndex(0);
    setFailed(false);
  }, [song.id, song.jacket_name, song.jacket_region]);

  if (!src) {
    return <span className="music-jacket__glyph">Cover</span>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      fetchPriority={priority ? "high" : undefined}
      className={cn("absolute inset-0 h-full w-full object-cover", className)}
      onError={() => {
        setIndex((current) => {
          if (current + 1 < candidates.length) return current + 1;
          setFailed(true);
          return current;
        });
      }}
    />
  );
}
