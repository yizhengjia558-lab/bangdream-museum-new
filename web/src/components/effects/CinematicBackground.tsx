"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn, assetUrl } from "@/lib/utils";
import { HERO_CG_BACKGROUNDS } from "@/lib/backgrounds";

interface CinematicBackgroundProps {
  src: string;
  alt?: string;
  overlay?: number;
  className?: string;
  kenBurns?: boolean;
  parallax?: boolean;
  remote?: boolean;
}

export function CinematicBackground({
  src,
  alt = "",
  overlay = 0.35,
  className,
  kenBurns = true,
  parallax = true,
  remote = false,
}: CinematicBackgroundProps) {
  const url = remote ? src : assetUrl(src);
  const [loaded, setLoaded] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, parallax ? 48 : 0]);
  const scale = useTransform(scrollY, [0, 600], [1.18, parallax ? 1.24 : 1.18]);

  return (
    <div className={cn("cinematic-bg pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="cinematic-bg__fallback absolute inset-0" aria-hidden />

      <motion.div
        className="cinematic-bg__layer absolute -inset-[18%]"
        style={parallax ? { y, scale } : { scale: 1.18 }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          decoding="async"
          loading="eager"
          onLoad={() => setLoaded(true)}
          className={cn(
            "cinematic-bg__image h-full w-full object-cover object-center transition-opacity duration-500",
            kenBurns && !parallax && "animate-ken-burns",
            loaded ? "opacity-100" : "opacity-0"
          )}
        />
      </motion.div>

      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, rgba(0,0,0,${overlay * 0.6}) 0%, rgba(0,0,0,${overlay}) 45%, rgba(0,0,0,${overlay + 0.15}) 100%)`,
        }}
      />
      <div className="bloom-layer absolute inset-0" aria-hidden />
    </div>
  );
}

/** Rotating hero CG backgrounds */
export function HeroCinematicBackground() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % HERO_CG_BACKGROUNDS.length), 12000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {HERO_CG_BACKGROUNDS.map((src, i) => (
        <motion.div
          key={src}
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <CinematicBackground src={src} remote kenBurns overlay={0.32} parallax={false} />
        </motion.div>
      ))}
      <div className="volumetric-rays absolute inset-0" aria-hidden />
    </div>
  );
}
