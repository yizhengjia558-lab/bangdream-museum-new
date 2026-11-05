"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  downloadDataUrl,
  extractAllSdPoses,
  SD_POSES,
  type ExtractedSdPose,
  type SdPose,
} from "@/lib/sd-sheet";
import { cn } from "@/lib/utils";

const POSE_LABEL_KEY: Record<SdPose, "card.sdPose1" | "card.sdPose2" | "card.sdPose3" | "card.sdPose4"> = {
  tl: "card.sdPose1",
  tr: "card.sdPose2",
  bl: "card.sdPose3",
  br: "card.sdPose4",
};

function safeFilename(value: string) {
  return value.replace(/[\\/:*?"<>|]+/g, "_").trim() || "sd-pose";
}

/** Canvas-extracted overview: centered transparent PNGs + per-pose save. */
export function SdPoseOverview({
  src,
  alt = "",
  caption,
  onClose,
  className,
}: {
  src: string;
  alt?: string;
  caption?: string;
  onClose: () => void;
  className?: string;
}) {
  const { t } = useLocale();
  const [poses, setPoses] = useState<ExtractedSdPose[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const title = caption || alt || "sd";

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPoses(null);

    void extractAllSdPoses(src, SD_POSES, 640)
      .then((result) => {
        if (!cancelled) {
          setPoses(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(t("card.sdExtractFailed"));
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [src, t]);

  const poseMap = useMemo(() => {
    const map = new Map<SdPose, string>();
    for (const item of poses ?? []) map.set(item.pose, item.dataUrl);
    return map;
  }, [poses]);

  return (
    <AnimatePresence>
      <motion.div
        key="sd-pose-overview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        className={cn("image-preview-overlay image-preview-overlay--sd", className)}
        onClick={onClose}
      >
        <button type="button" className="image-preview-overlay__close" onClick={onClose} aria-label={t("common.close")}>
          ×
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="sd-pose-overview"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="sd-pose-overview__header">
            <p className="sd-pose-overview__eyebrow">{t("card.sdOverview")}</p>
            {caption ? <h3 className="sd-pose-overview__title">{caption}</h3> : null}
          </header>

          {loading ? <div className="sd-pose-overview__loading" aria-hidden /> : null}

          {error ? <p className="sd-pose-overview__error">{error}</p> : null}

          {!loading && !error ? (
            <ul className="sd-pose-overview__grid" aria-label={t("card.sdOverview")}>
              {SD_POSES.map((pose) => {
                const dataUrl = poseMap.get(pose);
                const label = t(POSE_LABEL_KEY[pose]);
                return (
                  <li key={pose} className="sd-pose-overview__cell">
                    <div className="sd-pose-overview__frame sd-pose-overview__frame--transparent">
                      {dataUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={dataUrl} alt={`${alt} ${label}`} className="sd-pose-overview__img" />
                      ) : null}
                    </div>
                    <p className="sd-pose-overview__label">{label}</p>
                    <button
                      type="button"
                      className="sd-pose-overview__save"
                      disabled={!dataUrl}
                      onClick={() => {
                        if (!dataUrl) return;
                        downloadDataUrl(dataUrl, `${safeFilename(title)}-${pose}.png`);
                      }}
                    >
                      {t("card.sdSave")}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          <p className="sd-pose-overview__source">{t("card.sdSource")}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
