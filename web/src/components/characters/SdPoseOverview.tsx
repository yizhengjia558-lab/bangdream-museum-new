"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { SdSpriteFrame, SD_POSES, type SdPose } from "@/components/characters/SdSpriteFrame";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

const POSE_LABEL_KEY: Record<SdPose, "card.sdPose1" | "card.sdPose2" | "card.sdPose3" | "card.sdPose4"> = {
  tl: "card.sdPose1",
  tr: "card.sdPose2",
  bl: "card.sdPose3",
  br: "card.sdPose4",
};

/** Overview of all 4 Bestdori LIVE SD poses — each cell tightly cropped to one chibi. */
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

          <ul className="sd-pose-overview__grid" aria-label={t("card.sdOverview")}>
            {SD_POSES.map((pose) => (
              <li key={pose} className="sd-pose-overview__cell">
                <SdSpriteFrame
                  src={src}
                  alt={`${alt} ${t(POSE_LABEL_KEY[pose])}`}
                  pose={pose}
                  inset
                  className="sd-pose-overview__frame"
                />
                <p className="sd-pose-overview__label">{t(POSE_LABEL_KEY[pose])}</p>
              </li>
            ))}
          </ul>

          <p className="sd-pose-overview__source">{t("card.sdSource")}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
