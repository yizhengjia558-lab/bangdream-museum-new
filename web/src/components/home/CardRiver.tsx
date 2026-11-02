"use client";

import { useMemo } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const MAX_CARDS = 12;

/** Static featured strip — infinite CSS marquee was keeping ~60 layers compositing. */
export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const shown = useMemo(() => cards.slice(0, MAX_CARDS), [cards]);

  if (!shown.length) return null;

  return (
    <div className={cn("card-river", "card-river--static", variant === "strip" && "card-river-strip")}>
      <div className="card-river-strip-fade-top pointer-events-none absolute inset-x-0 top-0 z-10 h-12" aria-hidden />
      <div className="card-river-strip-fade-bottom pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16" aria-hidden />

      <div className="card-river-static-row">
        {shown.map((card) => (
          <div key={card.src} className="card-river-item card-river-item--static">
            <div className="card-river-frame">
              <AssetImage src={card.src} alt="" fill variant="mobile" className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
