"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export function CardPaletteBackground({
  gradient,
  className,
  scrimClassName,
}: {
  gradient: string;
  className?: string;
  scrimClassName?: string;
}) {
  const [layers, setLayers] = useState<[string, string]>(() => [gradient, gradient]);
  const [activeLayer, setActiveLayer] = useState(0);
  const lastGradient = useRef(gradient);
  const activeRef = useRef(0);

  useEffect(() => {
    if (gradient === lastGradient.current) return;

    const next = activeRef.current === 0 ? 1 : 0;
    setLayers((prev) => {
      const copy: [string, string] = [...prev];
      copy[next] = gradient;
      return copy;
    });

    requestAnimationFrame(() => {
      activeRef.current = next;
      setActiveLayer(next);
      lastGradient.current = gradient;
    });
  }, [gradient]);

  return (
    <div className={cn("card-palette-bg", className)} aria-hidden>
      {layers.map((layerGradient, index) => (
        <div
          key={index}
          className="card-palette-bg__layer"
          style={{
            background: layerGradient,
            opacity: activeLayer === index ? 1 : 0,
          }}
        />
      ))}
      <div className={cn("card-palette-bg__scrim", scrimClassName)} />
    </div>
  );
}
