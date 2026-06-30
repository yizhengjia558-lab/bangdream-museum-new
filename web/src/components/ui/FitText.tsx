"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface FitTextProps {
  text: string;
  className?: string;
  boxClassName?: string;
  minPx?: number;
  maxPx?: number;
  maxLines?: number;
  style?: CSSProperties;
}

/** Shrink font size so text fits within a fixed box (supports 1–2 lines). */
export function FitText({
  text,
  className,
  boxClassName,
  minPx = 11,
  maxPx = 17,
  maxLines = 2,
  style,
}: FitTextProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;

    const fit = () => {
      let size = maxPx;
      el.style.fontSize = `${size}px`;

      while (size > minPx && (el.scrollHeight > box.clientHeight || el.scrollWidth > box.clientWidth)) {
        size -= 0.5;
        el.style.fontSize = `${size}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [text, minPx, maxPx, maxLines]);

  return (
    <div ref={boxRef} className={cn("fit-text-box", boxClassName)}>
      <p
        ref={textRef}
        className={cn("fit-text", maxLines === 3 && "fit-text--3", className)}
        style={style}
      >
        {text}
      </p>
    </div>
  );
}
