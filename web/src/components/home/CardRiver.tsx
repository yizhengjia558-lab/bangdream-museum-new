"use client";

import { useEffect, useMemo, useRef } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import type { RiverCardItem } from "@/lib/data-types";
import { cn } from "@/lib/utils";

const AUTO_SPEED_PX_PER_SEC = 28;
const RESUME_DELAY_MS = 1800;

/** Full-bleed landscape strip with auto-scroll, plus wheel/drag control. */
export function CardRiver({
  cards,
  variant = "strip",
}: {
  cards: RiverCardItem[];
  variant?: "strip";
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  // Duplicate once so the marquee can loop without a visible jump.
  const loopCards = useMemo(() => (cards.length ? [...cards, ...cards] : []), [cards]);

  useEffect(() => {
    const row = rowRef.current;
    if (!row || cards.length < 2) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let paused = reducedMotion;
    let dragging = false;
    let resumeTimer = 0;
    let lastTs = 0;
    let startX = 0;
    let startScroll = 0;

    const halfWidth = () => row.scrollWidth / 2;

    const normalizeLoop = () => {
      const half = halfWidth();
      if (half <= 1) return;
      if (row.scrollLeft >= half) row.scrollLeft -= half;
      else if (row.scrollLeft < 0) row.scrollLeft += half;
    };

    const pause = () => {
      paused = true;
      window.clearTimeout(resumeTimer);
    };

    const scheduleResume = () => {
      if (reducedMotion) return;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        paused = false;
        lastTs = 0;
      }, RESUME_DELAY_MS);
    };

    const tick = (ts: number) => {
      if (!paused && !dragging) {
        if (!lastTs) lastTs = ts;
        const dt = Math.min(32, ts - lastTs) / 1000;
        lastTs = ts;
        row.scrollLeft += AUTO_SPEED_PX_PER_SEC * dt;
        normalizeLoop();
      } else {
        lastTs = 0;
      }
      raf = requestAnimationFrame(tick);
    };

    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) {
        pause();
        scheduleResume();
        return;
      }

      const maxScroll = row.scrollWidth - row.clientWidth;
      if (maxScroll <= 1) return;

      event.preventDefault();
      pause();
      row.scrollLeft += event.deltaY;
      normalizeLoop();
      scheduleResume();
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        pause();
        return;
      }
      dragging = true;
      pause();
      startX = event.clientX;
      startScroll = row.scrollLeft;
      row.setPointerCapture(event.pointerId);
      row.classList.add("is-dragging");
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      row.scrollLeft = startScroll - (event.clientX - startX);
      normalizeLoop();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "touch") {
        scheduleResume();
        return;
      }
      if (!dragging) return;
      dragging = false;
      row.classList.remove("is-dragging");
      try {
        row.releasePointerCapture(event.pointerId);
      } catch {
        /* ignore */
      }
      scheduleResume();
    };

    const onEnter = () => pause();
    const onLeave = () => {
      if (!dragging) scheduleResume();
    };

    row.addEventListener("wheel", onWheel, { passive: false });
    row.addEventListener("pointerdown", onPointerDown);
    row.addEventListener("pointermove", onPointerMove);
    row.addEventListener("pointerup", onPointerUp);
    row.addEventListener("pointercancel", onPointerUp);
    row.addEventListener("pointerenter", onEnter);
    row.addEventListener("pointerleave", onLeave);

    if (!reducedMotion) raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(resumeTimer);
      row.removeEventListener("wheel", onWheel);
      row.removeEventListener("pointerdown", onPointerDown);
      row.removeEventListener("pointermove", onPointerMove);
      row.removeEventListener("pointerup", onPointerUp);
      row.removeEventListener("pointercancel", onPointerUp);
      row.removeEventListener("pointerenter", onEnter);
      row.removeEventListener("pointerleave", onLeave);
    };
  }, [cards.length]);

  if (!cards.length) return null;

  return (
    <div
      className={cn(
        "card-river",
        "card-river--static",
        "card-river--landscape",
        "card-river--auto",
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
        {loopCards.map((card, index) => (
          <div
            key={`${card.src}-${index}`}
            className="card-river-item card-river-item--static"
            role="listitem"
            aria-hidden={index >= cards.length}
          >
            <div className="card-river-frame">
              <AssetImage src={card.src} alt="" fill variant="mobile" className="object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
