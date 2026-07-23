"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetImage } from "@/components/ui/AssetImage";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

/** Multi-shot camera tour approximating in-game KiraFes card cinema. */
const CAMERA_SHOTS = [
  { scale: 1.05, x: 0, y: 0, duration: 3.2 },
  { scale: 1.42, x: -10, y: -6, duration: 4.4 },
  { scale: 1.85, x: 6, y: -14, duration: 3.8 },
  { scale: 1.55, x: -4, y: 2, duration: 4.0 },
  { scale: 1.28, x: 4, y: 8, duration: 4.2 },
  { scale: 1.12, x: 0, y: 4, duration: 3.6 },
] as const;

type Shot = (typeof CAMERA_SHOTS)[number];

/**
 * Full-card cinematic stage for KIRAFES (动态卡),
 * styled after the in-game landscape card movie viewer.
 */
export function KirafesDynamicStage({
  cardSrc,
  cardName,
  className,
  compact = false,
}: {
  cardSrc: string;
  cardName: string;
  className?: string;
  compact?: boolean;
}) {
  const { t } = useLocale();
  const [shotIndex, setShotIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const shot: Shot = CAMERA_SHOTS[shotIndex % CAMERA_SHOTS.length];

  useEffect(() => {
    setShotIndex(0);
    setPlaying(true);
  }, [cardSrc]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setTimeout(() => {
      setShotIndex((i) => (i + 1) % CAMERA_SHOTS.length);
    }, shot.duration * 1000);
    return () => window.clearTimeout(timer);
  }, [playing, shotIndex, shot.duration]);

  const transform = useMemo(
    () => `translate3d(${shot.x}%, ${shot.y}%, 0) scale(${shot.scale})`,
    [shot.x, shot.y, shot.scale]
  );

  return (
    <div
      className={cn(
        "kirafes-cinema",
        compact && "kirafes-cinema--compact",
        className
      )}
    >
      <div className="kirafes-cinema__rail kirafes-cinema__rail--left" aria-hidden />
      <div className="kirafes-cinema__rail kirafes-cinema__rail--right" aria-hidden />

      <div className="kirafes-cinema__stage">
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
      </div>

      <div className="kirafes-cinema__hud">
        <span className="kirafes-cinema__live">{t("card.dynamicArt")}</span>
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
      </div>
    </div>
  );
}
