"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isVisitorAnalyticsEnabled, recordVisit } from "@/lib/analytics";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!isVisitorAnalyticsEnabled() || !pathname) return;
    void recordVisit(pathname);
  }, [pathname]);

  return null;
}
