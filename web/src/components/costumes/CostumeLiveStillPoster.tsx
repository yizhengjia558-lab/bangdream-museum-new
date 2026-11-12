"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const Live2DViewer = dynamic(
  () => import("@/components/live2d/Live2DViewer").then((m) => m.Live2DViewer),
  { ssr: false }
);

const BestdoriLive2DEmbed = dynamic(
  () => import("@/components/live2d/BestdoriLive2DEmbed").then((m) => m.BestdoriLive2DEmbed),
  { ssr: false }
);

const stillCache = new Map<string, string>();
const MAX_CONCURRENT_CAPTURES = 2;
let activeCaptures = 0;
const captureWaiters: Array<() => void> = [];

function acquireCaptureSlot(): Promise<void> {
  if (activeCaptures < MAX_CONCURRENT_CAPTURES) {
    activeCaptures += 1;
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    captureWaiters.push(() => {
      activeCaptures += 1;
      resolve();
    });
  });
}

function releaseCaptureSlot() {
  activeCaptures = Math.max(0, activeCaptures - 1);
  const next = captureWaiters.shift();
  if (next) next();
}

/**
 * Idle costume poster: frozen Live2D frame (never card art).
 * Falls back to a Bestdori embed if local snapshot fails.
 */
export function CostumeLiveStillPoster({
  assetBundleName,
  enabled,
  className,
}: {
  assetBundleName: string;
  enabled: boolean;
  className?: string;
}) {
  const cached = stillCache.get(assetBundleName) ?? null;
  const [frame, setFrame] = useState<string | null>(cached);
  const [inView, setInView] = useState(false);
  const [slotReady, setSlotReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [hostEl, setHostEl] = useState<HTMLDivElement | null>(null);
  const slotHeldRef = useRef(false);

  useEffect(() => {
    if (!hostEl) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "160px 0px", threshold: 0.01 }
    );
    io.observe(hostEl);
    return () => io.disconnect();
  }, [hostEl]);

  useEffect(() => {
    const needsCapture = enabled && inView && !frame && !failed && !stillCache.has(assetBundleName);
    if (!needsCapture) {
      setSlotReady(false);
      if (slotHeldRef.current) {
        slotHeldRef.current = false;
        releaseCaptureSlot();
      }
      return;
    }

    let cancelled = false;
    void acquireCaptureSlot().then(() => {
      if (cancelled) {
        releaseCaptureSlot();
        return;
      }
      slotHeldRef.current = true;
      setSlotReady(true);
    });

    return () => {
      cancelled = true;
      setSlotReady(false);
      if (slotHeldRef.current) {
        slotHeldRef.current = false;
        releaseCaptureSlot();
      }
    };
  }, [assetBundleName, enabled, failed, frame, inView]);

  const releaseHeldSlot = () => {
    if (!slotHeldRef.current) return;
    slotHeldRef.current = false;
    releaseCaptureSlot();
  };

  const showCapture = slotReady && !frame && !failed;
  const showBestdoriFallback = failed && enabled && inView;

  return (
    <div ref={setHostEl} className={cn("costume-tile__still", className)}>
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element -- data-URL snapshot from canvas
        <img src={frame} alt="" className="costume-tile__still-image" draggable={false} />
      ) : !showCapture && !showBestdoriFallback ? (
        <div className="costume-tile__still-fallback costume-tile__still-fallback--loading" />
      ) : null}

      {showCapture ? (
        <div className="costume-tile__still-capture">
          <Live2DViewer
            assetBundleName={assetBundleName}
            motionProfile="still"
            className="costume-tile__still-viewer"
            onStillFrame={(dataUrl) => {
              stillCache.set(assetBundleName, dataUrl);
              setFrame(dataUrl);
              setSlotReady(false);
              releaseHeldSlot();
            }}
            onError={() => {
              setFailed(true);
              setSlotReady(false);
              releaseHeldSlot();
            }}
          />
        </div>
      ) : null}

      {showBestdoriFallback ? (
        <div className="costume-tile__still-fallback-live">
          <BestdoriLive2DEmbed assetBundleName={assetBundleName} mode="bestdori" zoom={1} />
        </div>
      ) : null}
    </div>
  );
}
