"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Bestdori LIVE SD overview — show the full sdchara.png sheet (2×2 poses)
 * as one large image so every state is visible at once.
 */
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
          className="sd-pose-overview sd-pose-overview--sheet"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="sd-pose-overview__header">
            <p className="sd-pose-overview__eyebrow">{t("card.sdOverview")}</p>
            {caption ? <h3 className="sd-pose-overview__title">{caption}</h3> : null}
          </header>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt ? `${alt} — ${t("card.sdOverview")}` : t("card.sdOverview")}
            className="sd-pose-overview__sheet"
            decoding="async"
          />

          <p className="sd-pose-overview__source">{t("card.sdSource")}</p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
