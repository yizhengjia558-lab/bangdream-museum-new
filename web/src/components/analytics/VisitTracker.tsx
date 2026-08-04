"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { isVisitorAnalyticsEnabled, recordVisit } from "@/lib/analytics";
import { isCommunityEnabled, recordCommunityVisit } from "@/lib/community-api";

export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // Prefer community Worker page views (already deployed for this site).
    if (isCommunityEnabled()) {
      void recordCommunityVisit(pathname);
      return;
    }
    if (isVisitorAnalyticsEnabled()) {
      void recordVisit(pathname);
    }
  }, [pathname]);

  return null;
}
