"use client";

import { useMemo } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

/** Full-bleed landscape strip with native horizontal scrollbar. */
export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const shown = useMemo(() => cards, [cards]);

  if (!shown.length) return null;

  return (
    <div
      className={cn(
        "card-river",
        "card-river--static",
        "card-river--landscape",
        variant === "strip" && "card-river-strip"
      )}
    >
      <div className="card-river-static-row" role="list">
        {shown.map((card) => (
          <div key={card.src} className="card-river-item card-river-item--static" role="listitem">
            <div className="card-river-frame">
              <AssetImage src={card.src} alt="" fill variant="mobile" className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
