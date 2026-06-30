"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  fetchVisitorStats,
  isDetailedStats,
  isVisitorAnalyticsEnabled,
  type VisitorStatsDetailed,
  type VisitorStatsPublic,
} from "@/lib/analytics";

const TOKEN_STORAGE_KEY = "bd-stats-admin-token";

export function StatsDashboard() {
  const { t } = useLocale();
  const enabled = isVisitorAnalyticsEnabled();
  const [stats, setStats] = useState<VisitorStatsPublic | VisitorStatsDetailed | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(TOKEN_STORAGE_KEY) ?? "";
    setToken(saved);
    setTokenInput(saved);
  }, []);

  const loadStats = useCallback(async (adminToken?: string) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    const result = await fetchVisitorStats(adminToken || undefined);
    setLoading(false);

    if (!result) {
      setError(true);
      return;
    }

    setStats(result);
  }, [enabled]);

  useEffect(() => {
    void loadStats(token);
  }, [loadStats, token]);

  const maxDayCount = useMemo(() => {
    if (!stats || !isDetailedStats(stats) || !stats.days.length) return 1;
    return Math.max(...stats.days.map((day) => day.count), 1);
  }, [stats]);

  const applyToken = () => {
    const trimmed = tokenInput.trim();
    setToken(trimmed);
    if (trimmed) sessionStorage.setItem(TOKEN_STORAGE_KEY, trimmed);
    else sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    void loadStats(trimmed);
  };

  if (!enabled) {
    return (
      <section className="page-section relative pt-28 pb-20">
        <div className="relative page-container max-w-3xl">
          <SectionHeading title={t("analytics.title")} subtitle={t("analytics.disabledHint")} />
          <GlassPanel className="p-8 text-center">
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{t("analytics.setupSteps")}</p>
          </GlassPanel>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section relative pt-28 pb-20">
      <div className="pointer-events-none absolute inset-0 bloom-layer opacity-40" aria-hidden />
      <div className="relative page-container max-w-4xl">
        <SectionHeading title={t("analytics.title")} subtitle={t("analytics.subtitle")} />

        {loading ? (
          <GlassPanel className="stats-panel p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{t("analytics.loading")}</p>
          </GlassPanel>
        ) : error || !stats ? (
          <GlassPanel className="stats-panel p-10 text-center">
            <p className="text-sm text-[var(--text-secondary)]">{t("analytics.loadError")}</p>
          </GlassPanel>
        ) : (
          <>
            <div className="stats-summary-grid">
              <GlassPanel className="stats-metric p-6 sm:p-8">
                <p className="stats-metric-label">{t("analytics.totalVisitors")}</p>
                <p className="stats-metric-value">{stats.total.toLocaleString()}</p>
              </GlassPanel>
              <GlassPanel className="stats-metric p-6 sm:p-8">
                <p className="stats-metric-label">{t("analytics.todayVisitors")}</p>
                <p className="stats-metric-value">{(stats.today ?? 0).toLocaleString()}</p>
              </GlassPanel>
            </div>

            <GlassPanel className="stats-panel mt-8 p-6 sm:p-8">
              <h3 className="stats-panel-title">{t("analytics.adminUnlock")}</h3>
              <p className="stats-panel-desc">{t("analytics.adminHint")}</p>
              <div className="stats-token-row">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder={t("analytics.tokenPlaceholder")}
                  className="stats-token-input"
                  autoComplete="off"
                />
                <button type="button" className="stats-token-btn" onClick={applyToken}>
                  {t("analytics.tokenApply")}
                </button>
              </div>
            </GlassPanel>

            {isDetailedStats(stats) ? (
              <>
                <GlassPanel className="stats-panel mt-8 p-6 sm:p-8">
                  <h3 className="stats-panel-title">{t("analytics.recentDays")}</h3>
                  <ul className="stats-bar-chart">
                    {stats.days.map((day) => (
                      <li key={day.date} className="stats-bar-row">
                        <span className="stats-bar-date">{day.date.slice(5)}</span>
                        <div className="stats-bar-track">
                          <div
                            className="stats-bar-fill"
                            style={{ width: `${Math.max(6, (day.count / maxDayCount) * 100)}%` }}
                          />
                        </div>
                        <span className="stats-bar-count">{day.count}</span>
                      </li>
                    ))}
                  </ul>
                </GlassPanel>

                <GlassPanel className="stats-panel mt-8 p-6 sm:p-8">
                  <h3 className="stats-panel-title">{t("analytics.topPages")}</h3>
                  <ul className="stats-path-list">
                    {stats.topPaths.map((entry) => (
                      <li key={entry.path} className="stats-path-item">
                        <span className="stats-path-name">{entry.path}</span>
                        <span className="stats-path-count">{entry.count.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                </GlassPanel>
              </>
            ) : null}

            {stats.updatedAt ? (
              <p className="stats-updated mt-6 text-center text-[11px] text-[var(--text-muted)]">
                {t("analytics.updatedAt").replace("{time}", new Date(stats.updatedAt).toLocaleString())}
              </p>
            ) : null}
          </>
        )}

        <div className="mt-10 text-center">
          <Link href="/" className="stats-back-link">
            ← {t("nav.home")}
          </Link>
        </div>
      </div>
    </section>
  );
}
