"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface GlassButtonProps {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "ghost";
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export function GlassButton({
  href,
  onClick,
  children,
  className,
  variant = "primary",
  type = "button",
  disabled,
}: GlassButtonProps) {
  const cls = cn(
    "glass-button group relative inline-flex items-center justify-center gap-2 overflow-hidden",
    variant === "ghost" && "glass-button-ghost",
    disabled && "pointer-events-none opacity-50",
    className
  );

  const inner = (
    <>
      <span className="glass-button-shine" aria-hidden />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} className={cls} disabled={disabled}>
      {inner}
    </button>
  );
}
