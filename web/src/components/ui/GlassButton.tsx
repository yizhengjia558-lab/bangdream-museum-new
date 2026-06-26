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
}

export function GlassButton({ href, onClick, children, className, variant = "primary" }: GlassButtonProps) {
  const cls = cn(
    "glass-button group relative inline-flex items-center justify-center gap-2 overflow-hidden",
    variant === "ghost" && "glass-button-ghost",
    className
  );

  const inner = (
    <>
      <span className="glass-button-shine" aria-hidden />
      <span className="relative z-10">{children}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
