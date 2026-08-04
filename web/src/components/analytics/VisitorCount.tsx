"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchVisitorStats, isVisitorAnalyticsEnabled, shouldShowVisitorCount } from "@/lib/analytics";
import { fetchCommunityPublicStats, isCommunityEnabled } from "@/lib/community-api";

export function VisitorCount() {
  const { t } = useLocale();
  const [views, setViews] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);
  const [users, setUsers] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (shouldShowVisitorCount()) {
      fetchVisitorStats().then((stats) => {
        if (cancelled || !stats) return;
        setViews(stats.total);
        setToday(stats.today);
      });
    }

    if (isCommunityEnabled()) {
      fetchCommunityPublicStats().then((stats) => {
        if (cancelled || !stats) return;
        setUsers(stats.users);
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  const showViews = shouldShowVisitorCount() && views !== null;
  const showUsers = isCommunityEnabled() && users !== null;
  if (!showViews && !showUsers) return null;

  const parts: string[] = [];
  if (showViews) {
    parts.push(
      t("analytics.footerViews")
        .replace("{total}", views!.toLocaleString())
        .replace("{today}", (today ?? 0).toLocaleString())
    );
  }
  if (showUsers) {
    parts.push(t("analytics.footerUsers").replace("{count}", users!.toLocaleString()));
  }

  return (
    <p className="visitor-count mt-6 text-[11px] tracking-wide text-[var(--text-muted)]">
      {parts.join(" · ")}
      {isVisitorAnalyticsEnabled() && (
        <>
          {" · "}
          <Link href="/stats/" className="visitor-count-link">
            {t("analytics.viewStats")}
          </Link>
        </>
      )}
    </p>
  );
}
