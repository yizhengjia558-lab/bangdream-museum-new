"use client";

import { useEffect, useRef } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

/** Full-bleed landscape strip with wheel + drag horizontal scrolling. */
export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 1) return;

      const next = row.scrollLeft + event.deltaY;
      const clamped = Math.max(0, Math.min(maxScroll, next));
      if (clamped === row.scrollLeft) return;

      event.preventDefault();
      row.scrollLeft = clamped;
    };

    let dragging = false;
    let startX = 0;
    let startScroll = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      dragging = true;
      startX = event.clientX;
      startScroll = row.scrollLeft;
      row.setPointerCapture(event.pointerId);
      row.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      row.scrollLeft = startScroll - (event.clientX - startX);
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      row.classList.remove("is-dragging");
      try {
        row.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
    };

    row.addEventListener("wheel", onWheel, { passive: false });
    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);

    return () => {
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  if (!cards.length) return null;

  return (
    <div
      className={cn(
        "card-river",
        "card-river--static",
        "card-river--landscape",
        variant === "strip" && "card-river-strip"
      )}
    >
      <div
        ref={rowRef}
        className="card-river-static-row"
        role="list"
        tabIndex={0}
        aria-label="featured cards"
      >
        {cards.map((card) => (
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
