"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { assetUrl } from "@/lib/utils";

export interface HeroSlide {
  src: string;
  band: string;
}

export function HeroInteractiveBackground({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const [focused, setFocused] = useState(false);
  const [mouse, setMouse] = useState({ x: 0.5, y: 0.5 });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 10000);
    return () => clearInterval(t);
  }, [slides.length]);

  const parallaxX = (mouse.x - 0.5) * 20;
  const parallaxY = (mouse.y - 0.5) * 16;
  const blurPx = focused ? 10 : 20;
  const brightness = focused ? 0.78 : 0.65;

  return (
    <div
      ref={ref}
      className="absolute inset-0 overflow-hidden"
      onMouseMove={(e) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        setMouse({
          x: (e.clientX - rect.left) / rect.width,
          y: (e.clientY - rect.top) / rect.height,
        });
      }}
      onMouseEnter={() => setFocused(true)}
      onMouseLeave={() => {
        setFocused(false);
        setMouse({ x: 0.5, y: 0.5 });
      }}
    >
      {slides.map((slide, i) => (
        <motion.div
          key={`${slide.band}-${slide.src}`}
          initial={false}
          animate={{ opacity: i === index ? 1 : 0 }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-[-8%] transition-all duration-700 ease-out"
            style={{
              transform: `translate3d(${parallaxX}px, ${parallaxY}px, 0) scale(${focused ? 1.04 : 1.02})`,
              filter: `blur(${blurPx}px) brightness(${brightness}) saturate(1.1)`,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl(slide.src)}
              alt=""
              className="h-full w-full object-cover object-center animate-ken-burns"
            />
          </div>
        </motion.div>
      ))}

      {/* Layer stack: gradient + bloom */}
      <div className="hero-dream-overlay pointer-events-none absolute inset-0" aria-hidden />
      <div className="bloom-layer pointer-events-none absolute inset-0 opacity-80" aria-hidden />

      {/* Mouse reactive glow */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{ opacity: focused ? 1 : 0.35 }}
        aria-hidden
      >
        <div
          className="absolute h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300"
          style={{
            left: `${mouse.x * 100}%`,
            top: `${mouse.y * 100}%`,
            background: "radial-gradient(circle, rgba(233,67,94,0.18) 0%, rgba(255,107,138,0.08) 35%, transparent 70%)",
          }}
        />
      </div>

      {/* Band indicator — tucked under card river area */}
      {slides[index] && (
        <div className="pointer-events-none absolute bottom-6 left-1/2 z-10 -translate-x-1/2 opacity-0 sm:opacity-100">
          <motion.p
            key={slides[index].band}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-[family-name:var(--font-subtitle)] text-xs font-medium tracking-[0.35em] text-[var(--text-muted)] uppercase"
          >
            {slides[index].band}
          </motion.p>
        </div>
      )}
    </div>
  );
}
