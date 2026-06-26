import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function CardTile({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
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
      <button type="button" className={shellClass} onClick={onClick}>
        {inner}
      </button>
    );
  }

  return <div className={shellClass}>{inner}</div>;
}
