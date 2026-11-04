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
  /** Show a small WebP first, then swap up to `variant` when ready. */
  progressive?: boolean;
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
  progressive = false,
  onError,
}: AssetImageProps) {
  const hqSrc = cardImageUrl(src, variant);
  const lqSrc = cardImageUrl(src, "mobile");
  const [resolvedSrc, setResolvedSrc] = useState(() =>
    progressive && variant !== "mobile" ? lqSrc : hqSrc
  );

  useEffect(() => {
    const nextHq = cardImageUrl(src, variant);
    const nextLq = cardImageUrl(src, "mobile");

    if (!progressive || variant === "mobile" || nextHq === nextLq) {
      setResolvedSrc(nextHq);
      return;
    }

    setResolvedSrc(nextLq);
    let cancelled = false;
    const preload = new window.Image();
    preload.decoding = "async";
    preload.onload = () => {
      if (!cancelled) setResolvedSrc(nextHq);
    };
    preload.onerror = () => {
      if (!cancelled) setResolvedSrc(nextHq);
    };
    preload.src = nextHq;

    return () => {
      cancelled = true;
      preload.onload = null;
      preload.onerror = null;
    };
  }, [src, variant, progressive]);

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
