export type VisitorStatsPublic = {
  total: number;
  today: number;
  updatedAt?: string;
};

export type VisitorStatsDetailed = VisitorStatsPublic & {
  days: { date: string; count: number }[];
  topPaths: { path: string; count: number }[];
};

let resolvedApiBase: string | undefined;
let resolvePromise: Promise<string> | null = null;

function buildTimeApiBase() {
  return process.env.NEXT_PUBLIC_VISITOR_API?.replace(/\/$/, "") ?? "";
}

/** Resolve analytics API URL: build-time env first, then /visitor-api.json at runtime. */
export async function resolveVisitorApiBase(): Promise<string> {
  if (resolvedApiBase !== undefined) return resolvedApiBase;

  const fromEnv = buildTimeApiBase();
  if (fromEnv) {
    resolvedApiBase = fromEnv;
    return fromEnv;
  }

  if (typeof window === "undefined") {
    resolvedApiBase = "";
    return "";
  }

  if (!resolvePromise) {
    resolvePromise = (async () => {
      try {
        const prefix = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
        const res = await fetch(`${prefix}/visitor-api.json`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { api?: string };
          const api = data.api?.trim().replace(/\/$/, "") ?? "";
          if (api) {
            resolvedApiBase = api;
            return api;
          }
        }
      } catch {
        /* fall through */
      }
      resolvedApiBase = "";
      return "";
    })();
  }

  return resolvePromise;
}

export function isVisitorAnalyticsEnabled() {
  return Boolean(buildTimeApiBase());
}

export function shouldShowVisitorCount() {
  if (process.env.NEXT_PUBLIC_SHOW_VISITOR_COUNT === "0") return false;
  return true;
}

export async function recordVisit(path: string, apiBase?: string) {
  const base = apiBase ?? (await resolveVisitorApiBase());
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

export async function fetchVisitorStats(
  token?: string,
  apiBase?: string
): Promise<VisitorStatsPublic | VisitorStatsDetailed | null> {
  const base = apiBase ?? (await resolveVisitorApiBase());
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
