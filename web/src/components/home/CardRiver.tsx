"use client";

import { useMemo } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const MAX_CARDS = 12;

/**
 * CSS marquee auto-scroll (transform, seamless loop).
 * Keeps moving by default — no hover-pause, so a full-bleed strip won't look "stuck".
 */
export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const shown = useMemo(() => cards.slice(0, MAX_CARDS), [cards]);
  const loopCards = useMemo(() => (shown.length ? [...shown, ...shown] : []), [shown]);

  if (!shown.length) return null;

  return (
    <div
      className={cn(
        "card-river",
        "card-river--landscape",
        "card-river--marquee",
        variant === "strip" && "card-river-strip"
      )}
    >
      <div className="card-river-marquee-viewport" role="list" aria-label="featured cards">
        <div className="card-river-marquee-track">
          {loopCards.map((card, index) => (
            <div
              key={`${card.src}-${index}`}
              className="card-river-item card-river-item--static"
              role="listitem"
              aria-hidden={index >= shown.length}
            >
              <div className="card-river-frame">
                <AssetImage
                  src={card.src}
                  alt=""
                  fill
                  variant="mobile"
                  priority={index < 3}
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
