"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit, resolveVisitorApiBase } from "@/lib/analytics";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    resolveVisitorApiBase().then((base) => {
      if (base) void recordVisit(pathname, base);
    });
  }, [pathname]);

  return null;
}
