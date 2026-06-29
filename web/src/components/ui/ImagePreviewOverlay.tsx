"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { SdSpriteFrame } from "@/components/characters/SdSpriteFrame";
import { cn } from "@/lib/utils";

export function ImagePreviewOverlay({
  src,
  alt = "",
  caption,
  onClose,
  className,
  cropSprite = false,
}: {
  src: string;
  alt?: string;
  caption?: string;
  onClose: () => void;
  className?: string;
  /** Bestdori sdchara.png is a 2×2 sheet — preview one standing frame. */
  cropSprite?: boolean;
}) {
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
        key="image-preview-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.28 }}
        className={cn("image-preview-overlay", className)}
        onClick={onClose}
      >
        <button type="button" className="image-preview-overlay__close" onClick={onClose} aria-label="Close">
          ×
        </button>
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="image-preview-overlay__inner"
          onClick={(e) => e.stopPropagation()}
        >
          {cropSprite ? (
            <SdSpriteFrame src={src} alt={alt} className="image-preview-overlay__sd-frame" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={src} alt={alt} className="image-preview-overlay__img" />
          )}
          {caption ? <p className="image-preview-overlay__caption">{caption}</p> : null}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
