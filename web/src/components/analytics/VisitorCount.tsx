"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchVisitorStats, shouldShowVisitorCount } from "@/lib/analytics";

export function VisitorCount() {
  const { t } = useLocale();
  const [total, setTotal] = useState<number | null>(null);
  const [today, setToday] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldShowVisitorCount()) return;

    let cancelled = false;
    fetchVisitorStats().then((stats) => {
      if (cancelled || !stats) return;
      setTotal(stats.total);
      setToday(stats.today);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!shouldShowVisitorCount() || total === null) return null;

  return (
    <p className="visitor-count mt-6 text-[11px] tracking-wide text-[var(--text-muted)]">
      {t("analytics.footerCount")
        .replace("{total}", total.toLocaleString())
        .replace("{today}", (today ?? 0).toLocaleString())}
      {" · "}
      <Link href="/stats/" className="visitor-count-link">
        {t("analytics.viewStats")}
      </Link>
    </p>
  );
}
