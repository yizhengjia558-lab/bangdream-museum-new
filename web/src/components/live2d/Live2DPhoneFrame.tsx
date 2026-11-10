"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.12;
const PAN_STEP = 72;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function Live2DPhoneFrame({
  children,
  className,
}: {
  children: (zoom: number) => ReactNode;
  className?: string;
}) {
  const { t } = useLocale();
  const [zoom, setZoom] = useState(1);
  const screenRef = useRef<HTMLDivElement>(null);
  const canPan = zoom > 1.01;

  const panBy = (deltaY: number) => {
    screenRef.current?.scrollBy({ top: deltaY, behavior: "smooth" });
  };

  return (
    <div className={cn("card-live2d-phone", className)} style={{ "--live2d-zoom": zoom } as CSSProperties}>
      <div className="card-live2d-phone__toolbar">
        <button
          type="button"
          className="card-live2d-phone__tool-btn"
          aria-label={t("card.live2dZoomOut")}
          onClick={() => setZoom((z) => clampZoom(z - ZOOM_STEP))}
        >
          −
        </button>
        <span className="card-live2d-phone__zoom-label">{Math.round(zoom * 100)}%</span>
        <button
          type="button"
          className="card-live2d-phone__tool-btn"
          aria-label={t("card.live2dZoomIn")}
          onClick={() => setZoom((z) => clampZoom(z + ZOOM_STEP))}
        >
          +
        </button>
        <button
          type="button"
          className="card-live2d-phone__tool-btn card-live2d-phone__tool-btn--reset"
          aria-label={t("card.live2dZoomReset")}
          onClick={() => {
            setZoom(1);
            if (screenRef.current) screenRef.current.scrollTop = 0;
          }}
        >
          ↺
        </button>
      </div>
      <div className="card-live2d-phone__stage">
        <div
          ref={screenRef}
          className={cn(
            "card-live2d-phone__screen",
            // Only enable internal pan when zoomed; at 100% vertical swipes
            // must scroll the card modal instead of getting trapped here.
            canPan && "card-live2d-phone__screen--pan"
          )}
        >
          <div className="card-live2d-phone__scroll-body">{children(zoom)}</div>
        </div>

        {canPan ? (
          <div className="card-live2d-phone__pan-rail">
            <button
              type="button"
              className="card-live2d-phone__pan-btn"
              aria-label={t("card.live2dPanUp")}
              onClick={() => panBy(-PAN_STEP)}
            >
              ▲
            </button>
            <div className="card-live2d-phone__pan-track" aria-hidden />
            <button
              type="button"
              className="card-live2d-phone__pan-btn"
              aria-label={t("card.live2dPanDown")}
              onClick={() => panBy(PAN_STEP)}
            >
              ▼
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
