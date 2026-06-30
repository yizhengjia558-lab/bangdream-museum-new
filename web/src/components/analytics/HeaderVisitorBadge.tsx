"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { fetchVisitorStats, resolveVisitorApiBase, shouldShowVisitorCount } from "@/lib/analytics";

export function HeaderVisitorBadge() {
  const { t } = useLocale();
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!shouldShowVisitorCount()) return;

    let cancelled = false;
    resolveVisitorApiBase().then(async (base) => {
      if (cancelled || !base) return;
      const stats = await fetchVisitorStats(undefined, base);
      if (cancelled || !stats) return;
      setTotal(stats.total);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  if (total === null) return null;

  return (
    <Link
      href="/stats/"
      className="header-visitor-badge hidden rounded-full px-2.5 py-1.5 font-[family-name:var(--font-subtitle-active)] text-[9px] font-semibold tracking-[0.04em] text-[var(--text-secondary)] transition hover:bg-[var(--glass-hover)] hover:text-[var(--text-primary)] sm:inline-flex sm:items-center sm:gap-1"
      title={t("analytics.viewStats")}
    >
      <span aria-hidden className="text-[10px] opacity-80">
        ◉
      </span>
      <span>{total.toLocaleString()}</span>
    </Link>
  );
}
