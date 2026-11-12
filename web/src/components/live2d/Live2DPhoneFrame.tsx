"use client";

import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const MIN_ZOOM = 0.75;
const MAX_ZOOM = 2;
const ZOOM_STEP = 0.12;

function clampZoom(value: number) {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

export function Live2DPhoneFrame({
  children,
  className,
  showToolbar = true,
  fixedZoom = 1,
}: {
  children: (zoom: number) => ReactNode;
  className?: string;
  /** Gallery tiles hide zoom chrome; detail keeps controls. */
  showToolbar?: boolean;
  /** Used when toolbar is hidden. */
  fixedZoom?: number;
}) {
  const { t } = useLocale();
  const [zoom, setZoom] = useState(1);
  const screenRef = useRef<HTMLDivElement>(null);
  const activeZoom = showToolbar ? zoom : clampZoom(fixedZoom);

  return (
    <div
      className={cn("card-live2d-phone", !showToolbar && "card-live2d-phone--compact", className)}
      style={{ "--live2d-zoom": activeZoom } as CSSProperties}
    >
      {showToolbar ? (
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
            onClick={() => setZoom(1)}
          >
            ↺
          </button>
        </div>
      ) : null}
      <div className="card-live2d-phone__stage">
        {/* Fixed phone framing — no side scrollbar; +/- still zooms in place. */}
        <div ref={screenRef} className="card-live2d-phone__screen">
          <span className="card-live2d-phone__notch" aria-hidden />
          <div className="card-live2d-phone__scroll-body">{children(activeZoom)}</div>
          <span className="card-live2d-phone__home" aria-hidden />
        </div>
      </div>
    </div>
  );
}
