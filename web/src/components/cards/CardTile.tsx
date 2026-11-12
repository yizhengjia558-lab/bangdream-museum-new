import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardTile({
  children,
  className,
  style,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}) {
  const shellClass = cn(
    "glass-frame card-shine card-tile group relative",
    onClick && "cursor-pointer",
    className
  );
  const inner = <div className="card-tile-inner">{children}</div>;

  if (onClick) {
    return (
      <button type="button" className={shellClass} style={style} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return (
    <div className={shellClass} style={style}>
      {inner}
    </div>
  );
}
