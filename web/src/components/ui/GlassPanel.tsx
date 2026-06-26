import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  glow?: string;
}

export function GlassPanel({ children, className, style, glow }: GlassPanelProps) {
  return (
    <div className={cn("glass-panel", className)} style={style}>
      {glow && (
        <div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-60"
          style={{ background: glow, filter: "blur(40px)" }}
          aria-hidden
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
