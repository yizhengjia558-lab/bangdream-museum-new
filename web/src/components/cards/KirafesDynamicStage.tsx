"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { assetUrl, cn } from "@/lib/utils";

/** Multi-shot camera tour fallback when no memorial video is mapped. */
const CAMERA_SHOTS = [
  { scale: 1.05, x: 0, y: 0, duration: 3.2 },
  { scale: 1.42, x: -10, y: -6, duration: 4.4 },
  { scale: 1.85, x: 6, y: -14, duration: 3.8 },
  { scale: 1.55, x: -4, y: 2, duration: 4.0 },
  { scale: 1.28, x: 4, y: 8, duration: 4.2 },
  { scale: 1.12, x: 0, y: 4, duration: 3.6 },
] as const;

type Shot = (typeof CAMERA_SHOTS)[number];

function bilibiliPlayerSrc(bvid: string) {
  const params = new URLSearchParams({
    isOutside: "true",
    bvid,
    high_quality: "1",
    danmaku: "0",
    autoplay: "1",
    muted: "0",
  });
  return `https://player.bilibili.com/player.html?${params.toString()}`;
}

/**
 * KiraFes dynamic art stage.
 * Prefers local memorial mp4 (same frame size as static card art),
 * then Bilibili embed, then Ken Burns fallback.
 */
export function KirafesDynamicStage({
  cardSrc,
  cardName,
  videoSrc,
  bilibiliBvid,
  className,
  compact = false,
}: {
  cardSrc: string;
  cardName: string;
  videoSrc?: string | null;
  bilibiliBvid?: string | null;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const [shotIndex, setShotIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const localSrc = videoSrc ? assetUrl(videoSrc) : "";
  const hasLocal = Boolean(localSrc);
  const hasBilibili = Boolean(bilibiliBvid) && !hasLocal;
  const hasVideo = hasLocal || hasBilibili;
  const shot: Shot = CAMERA_SHOTS[shotIndex % CAMERA_SHOTS.length];

  useEffect(() => {
    setShotIndex(0);
    setPlaying(true);
  }, [cardSrc, videoSrc, bilibiliBvid]);

  useEffect(() => {
    if (!playing || hasVideo) return;
    const timer = window.setTimeout(() => {
      setShotIndex((i) => (i + 1) % CAMERA_SHOTS.length);
    }, shot.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, shotIndex, shot.duration, hasVideo]);

  const transform = useMemo(
    () => `translate3d(${shot.x}%, ${shot.y}%, 0) scale(${shot.scale})`,
    [shot.x, shot.y, shot.scale]
  );

  if (hasLocal) {
    return (
      <div className={cn("card-detail-image-frame kirafes-local-frame", compact && "kirafes-local-frame--compact", className)}>
        <video
          key={localSrc}
          className="kirafes-local-video"
          src={localSrc}
          autoPlay
          loop
          muted
          playsInline
          controls
          preload="metadata"
          aria-label={`${cardName} · ${t("card.dynamicArt")}`}
        />
      </div>
    );
  }

  return (
    <div className={cn("kirafes-cinema", compact && "kirafes-cinema--compact", className)}>
      <div className="kirafes-cinema__rail kirafes-cinema__rail--left" aria-hidden />
      <div className="kirafes-cinema__rail kirafes-cinema__rail--right" aria-hidden />

      <div className="kirafes-cinema__stage">
        {hasBilibili ? (
          <iframe
            key={bilibiliBvid}
            className="kirafes-cinema__iframe"
            src={bilibiliPlayerSrc(bilibiliBvid!)}
            title={`${cardName} · ${t("card.dynamicArt")}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        ) : (
          <>
            <div
              className="kirafes-cinema__camera"
              style={{
                transform,
                transitionDuration: `${shot.duration}s`,
              }}
            >
              <AssetImage src={cardSrc} alt={cardName} fill className="object-cover" priority />
            </div>
            <div className="kirafes-cinema__vignette" aria-hidden />
            <div className="kirafes-cinema__grain" aria-hidden />
            <div className="kirafes-cinema__flare" aria-hidden />
            <div className="kirafes-cinema__particles" aria-hidden>
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </>
        )}
      </div>

      <div className="kirafes-cinema__hud">
        <span className="kirafes-cinema__live">{t("card.dynamicArt")}</span>
        {hasBilibili ? (
          <a
            className="kirafes-cinema__open"
            href={`https://www.bilibili.com/video/${bilibiliBvid}/`}
            target="_blank"
            rel="noreferrer"
          >
            {t("card.openBilibili")}
          </a>
        ) : (
          <>
            <button
              type="button"
              className="kirafes-cinema__play"
              onClick={() => setPlaying((v) => !v)}
              aria-label={playing ? t("card.pauseCinema") : t("card.playCinema")}
            >
              {playing ? "❚❚" : "▶"}
            </button>
            <div className="kirafes-cinema__progress" aria-hidden>
              {CAMERA_SHOTS.map((_, i) => (
                <span key={i} className={cn(i === shotIndex && "is-active")} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
