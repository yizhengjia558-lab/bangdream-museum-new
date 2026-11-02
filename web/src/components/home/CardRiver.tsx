"use client";

import { useMemo, type CSSProperties } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

type LaneConfig = {
  direction: "left" | "right";
  duration: number;
  depth: number;
  cardW: number;
};

/** Keep 2 slow lanes — enough motion, far fewer animated images. */
const LANES: LaneConfig[] = [
  { direction: "left", duration: 90, depth: 0.85, cardW: 96 },
  { direction: "right", duration: 110, depth: 0.7, cardW: 88 },
];

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
      const laneCards: RiverCardItem[] = [];
      for (let i = 0; i < cards.length; i++) {
        if (i % LANES.length !== laneIdx) continue;
        laneCards.push(cards[i]);
      }
      // Duplicate once for seamless CSS loop.
      return { ...lane, cards: [...laneCards, ...laneCards] };
    });
  }, [cards]);

  if (!lanes.length) return null;

  return (
    <div className={cn("card-river", "card-river--lite", variant === "strip" && "card-river-strip")}>
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
                      "--float-dur": "0s",
                      "--float-delay": "0s",
                      "--rotate": "0deg",
                    } as CSSProperties
                  }
                >
                  <div className="card-river-frame">
                    <AssetImage src={card.src} alt="" fill variant="mobile" className="object-cover" />
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
