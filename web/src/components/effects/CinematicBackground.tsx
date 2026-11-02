"use client";

import { useState } from "react";
import { cardImageUrl } from "@/lib/card-image";
import { useMobilePerf } from "@/hooks/useMobilePerf";
import { cn, assetUrl } from "@/lib/utils";

interface CinematicBackgroundProps {
  src: string;
  alt?: string;
  overlay?: number;
  className?: string;
  kenBurns?: boolean;
  parallax?: boolean;
  remote?: boolean;
}

/** Static cinematic backdrop — no scroll-linked motion (was a major frame hitch). */
export function CinematicBackground({
  src,
  alt = "",
  overlay = 0.35,
  className,
  kenBurns = false,
  parallax: _parallax = false,
  remote = false,
}: CinematicBackgroundProps) {
  const mobile = useMobilePerf();
  const url = remote ? src : mobile ? cardImageUrl(src, "mobile") : cardImageUrl(src, "thumb");
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={cn("cinematic-bg pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="cinematic-bg__fallback absolute inset-0" aria-hidden />

      <div className="cinematic-bg__layer absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          decoding="async"
          loading="eager"
          onLoad={() => setLoaded(true)}
          onError={(e) => {
            const img = e.currentTarget;
            const full = remote ? src : assetUrl(src);
            if (img.src !== full) img.src = full;
          }}
          className={cn(
            "cinematic-bg__image h-full w-full object-cover object-center transition-opacity duration-500",
            kenBurns && "animate-ken-burns",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${overlay * 0.6}) 0%, rgba(0,0,0,${overlay}) 45%, rgba(0,0,0,${overlay + 0.15}) 100%)`,
        }}
      />
    </div>
  );
}
