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
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-35"
          style={{ background: glow }}
          aria-hidden
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
