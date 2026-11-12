"use client";

import { useEffect, useState } from "react";
import { requestCostumeStill } from "@/components/costumes/CostumeStillCaptureHost";
import { getCostumeStill, getCostumeThumbDirectUrl } from "@/lib/costume-still-cache";
import { getBestdoriAssetProxyUrl } from "@/lib/live2d-proxy";
import { preferLive2DRegion } from "@/lib/bestdori-assets";
import { cn } from "@/lib/utils";

/**
 * Idle poster: static image only (cached Live2D still, else Bestdori costume icon).
 * Never mounts Live2D here — that stays on hover via the parent tile.
 */
export function CostumeLiveStillPoster({
  assetBundleName,
  costumeId,
  enabled,
  className,
}: {
  assetBundleName: string;
  costumeId?: number | null;
  enabled: boolean;
  className?: string;
}) {
  const [frame, setFrame] = useState<string | null>(() => getCostumeStill(assetBundleName));
  const [inView, setInView] = useState(false);
  const [hostEl, setHostEl] = useState<HTMLDivElement | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  useEffect(() => {
    if (!hostEl) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(Boolean(entry?.isIntersecting)),
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    io.observe(hostEl);
    return () => io.disconnect();
  }, [hostEl]);

  useEffect(() => {
    if (!enabled || !inView) return;
    const cached = getCostumeStill(assetBundleName);
    if (cached) {
      setFrame(cached);
      return;
    }
    let cancelled = false;
    void requestCostumeStill(assetBundleName).then((url) => {
      if (!cancelled && url) setFrame(url);
    });
    return () => {
      cancelled = true;
    };
  }, [assetBundleName, enabled, inView]);

  const region = preferLive2DRegion(assetBundleName);
  const thumbDirect =
    costumeId != null ? getCostumeThumbDirectUrl(costumeId, assetBundleName, region) : null;
  const thumbProxy =
    costumeId != null
      ? getBestdoriAssetProxyUrl(
          `${region}/thumb/costume/group${Math.floor(costumeId / 50)}_rip/${assetBundleName}.png`
        )
      : null;

  return (
    <div ref={setHostEl} className={cn("costume-tile__still", className)}>
      {frame ? (
        // eslint-disable-next-line @next/next/no-img-element -- data-URL Live2D still
        <img src={frame} alt="" className="costume-tile__still-image" draggable={false} />
      ) : thumbDirect && !thumbFailed ? (
        // eslint-disable-next-line @next/next/no-img-element -- Bestdori costume icon while still generates
        <img
          src={thumbDirect}
          alt=""
          className="costume-tile__still-thumb"
          draggable={false}
          referrerPolicy="no-referrer"
          onError={(e) => {
            if (thumbProxy && e.currentTarget.src !== thumbProxy) {
              e.currentTarget.src = thumbProxy;
              return;
            }
            setThumbFailed(true);
          }}
        />
      ) : (
        <div className="costume-tile__still-fallback costume-tile__still-fallback--loading" />
      )}
    </div>
  );
}
