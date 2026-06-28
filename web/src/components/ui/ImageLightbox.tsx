"use client";

import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AssetImage } from "@/components/ui/AssetImage";

export function ImageLightbox({
  open,
  src,
  alt,
  caption,
  onClose,
  closeLabel,
}: {
  open: boolean;
  src: string;
  alt: string;
  caption?: string;
  onClose: () => void;
  closeLabel: string;
}) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, handleKeyDown]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="lightbox"
          className="image-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            className="image-lightbox-backdrop"
            aria-label={closeLabel}
            onClick={onClose}
          />
          <motion.div
            className="image-lightbox-content"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <button type="button" className="image-lightbox-close" aria-label={closeLabel} onClick={onClose}>
              ×
            </button>
            <div className="image-lightbox-frame">
              <AssetImage src={src} alt={alt} className="image-lightbox-img" priority />
            </div>
            {caption ? <p className="image-lightbox-caption">{caption}</p> : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
