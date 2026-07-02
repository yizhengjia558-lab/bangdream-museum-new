"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { cardImageUrl } from "@/lib/card-image";
import { assetUrl, cn } from "@/lib/utils";

interface AssetImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  variant?: "thumb" | "mobile" | "full";
  onError?: ImgHTMLAttributes<HTMLImageElement>["onError"];
}

/** Native img — avoids Next/Image issues with Chinese asset paths on Windows. */
export function AssetImage({
  src,
  alt,
  className,
  fill,
  priority,
  variant = "full",
  onError,
}: AssetImageProps) {
  const [resolvedSrc, setResolvedSrc] = useState(() => cardImageUrl(src, variant));

  useEffect(() => {
    setResolvedSrc(cardImageUrl(src, variant));
  }, [src, variant]);

  const handleError: ImgHTMLAttributes<HTMLImageElement>["onError"] = (event) => {
    if (variant === "mobile") {
      const thumb = cardImageUrl(src, "thumb");
      if (resolvedSrc !== thumb) {
        setResolvedSrc(thumb);
        return;
      }
    }
    if (variant === "thumb" || variant === "mobile") {
      const full = assetUrl(src);
      if (resolvedSrc !== full) {
        setResolvedSrc(full);
        return;
      }
    }
    onError?.(event);
  };

  if (fill) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolvedSrc}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={priority ? "high" : undefined}
        onError={handleError}
        className={cn("absolute inset-0 h-full w-full", className)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolvedSrc}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={handleError}
      className={className}
    />
  );
}
