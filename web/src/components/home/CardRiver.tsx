"use client";

import { useMemo, type CSSProperties } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/hero-cards";
import { cn } from "@/lib/utils";

type LaneConfig = {
  direction: "left" | "right";
  duration: number;
  depth: number;
  cardW: number;
  floatDuration: number;
  rotateRange: number;
};

const LANES: LaneConfig[] = [
  { direction: "left", duration: 80, depth: 0.45, cardW: 80, floatDuration: 5, rotateRange: 5 },
  { direction: "right", duration: 62, depth: 0.75, cardW: 96, floatDuration: 4.2, rotateRange: 4 },
  { direction: "left", duration: 48, depth: 1, cardW: 112, floatDuration: 3.5, rotateRange: 3 },
  { direction: "right", duration: 72, depth: 0.6, cardW: 88, floatDuration: 4.6, rotateRange: 6 },
  { direction: "left", duration: 88, depth: 0.35, cardW: 72, floatDuration: 5.5, rotateRange: 7 },
];

function hashSeed(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const lanes = useMemo(() => {
    if (!cards.length) return [];

    return LANES.map((lane, laneIdx) => {
      const laneCards: (RiverCardItem & { rotate: number; floatDelay: number })[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (i % LANES.length !== laneIdx) continue;
        const card = cards[i];
        const seed = hashSeed(`${card.src}-${i}`);
        laneCards.push({
          ...card,
          rotate: ((seed % 200) / 100 - 1) * lane.rotateRange,
          floatDelay: (seed % 400) / 100,
        });
      }
      return { ...lane, cards: [...laneCards, ...laneCards] };
    });
  }, [cards]);

  if (!lanes.length) return null;

  return (
    <div className={cn("card-river", variant === "strip" && "card-river-strip")}>
      <div className="card-river-strip-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-12" aria-hidden />
      <div className="card-river-strip-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16" aria-hidden />

      <div className="card-river-lanes card-river-lanes-strip">
        {lanes.map((lane, li) => (
          <div key={li} className="card-river-lane overflow-hidden">
            <div
              className={`card-river-track card-river-track-${lane.direction}`}
              style={{ animationDuration: `${lane.duration}s` }}
            >
              {lane.cards.map((card, ci) => (
                <div
                  key={`${li}-${ci}-${card.src}`}
                  className="card-river-item"
                  style={
                    {
                      "--depth": lane.depth,
                      "--card-w": `${lane.cardW}px`,
                      "--float-dur": `${lane.floatDuration}s`,
                      "--float-delay": `${card.floatDelay}s`,
                      "--rotate": `${card.rotate}deg`,
                    } as CSSProperties
                  }
                >
                  <div className="card-river-frame">
                    <AssetImage src={card.src} alt="" fill className="object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
