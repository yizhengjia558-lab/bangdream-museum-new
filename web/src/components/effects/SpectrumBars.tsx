"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

export function SpectrumBars({ color = "#FF5522" }: { color?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const bars = ref.current.querySelectorAll("[data-bar]");
    gsap.to(bars, {
      scaleY: () => 0.25 + Math.random() * 0.75,
      duration: () => 0.35 + Math.random() * 0.45,
      repeat: -1,
      yoyo: true,
      stagger: { each: 0.04, from: "random" },
      ease: "sine.inOut",
    });
  }, []);

  return (
    <div ref={ref} className="flex h-16 items-end gap-1 opacity-70">
      {Array.from({ length: 32 }).map((_, i) => (
        <div
          key={i}
          data-bar
          className="w-1 origin-bottom rounded-full"
          style={{
            height: `${18 + (i % 5) * 8}px`,
            background: `linear-gradient(to top, ${color}88, ${color})`,
            boxShadow: `0 0 12px ${color}55`,
          }}
        />
      ))}
    </div>
  );
}
