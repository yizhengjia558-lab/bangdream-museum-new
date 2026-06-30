export type VisitorStatsPublic = {
  total: number;
  today: number;
  updatedAt?: string;
};

export type VisitorStatsDetailed = VisitorStatsPublic & {
  days: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
};

function apiBase() {
  return process.env.NEXT_PUBLIC_VISITOR_API?.replace(/\/$/, "") ?? "";
}

export function isVisitorAnalyticsEnabled() {
  return Boolean(apiBase());
}

export function shouldShowVisitorCount() {
  if (process.env.NEXT_PUBLIC_SHOW_VISITOR_COUNT === "0") return false;
  return isVisitorAnalyticsEnabled();
}

export async function recordVisit(path: string) {
  const base = apiBase();
  if (!base || typeof window === "undefined") return;

  try {
    await fetch(`${base}/hit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
      keepalive: true,
    });
  } catch {
    /* non-blocking */
  }
}

export async function fetchVisitorStats(token?: string): Promise<VisitorStatsPublic | VisitorStatsDetailed | null> {
  const base = apiBase();
  if (!base) return null;

  const url = new URL(`${base}/stats`);
  if (token) url.searchParams.set("token", token);

  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as VisitorStatsPublic | VisitorStatsDetailed;
  } catch {
    return null;
  }
}

export function isDetailedStats(
  stats: VisitorStatsPublic | VisitorStatsDetailed | null
): stats is VisitorStatsDetailed {
  return Boolean(stats && "days" in stats && Array.isArray(stats.days));
}
