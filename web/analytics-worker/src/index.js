/** @type {import('@cloudflare/workers-types').ExportedHandler<{ STATS: KVNamespace; STATS_SECRET?: string; ALLOWED_ORIGINS?: string }>} */

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowOrigin =
    allowed.includes("*") || (origin && allowed.includes(origin)) ? origin || "*" : allowed[0] || "*";

  return {
    ...CORS_HEADERS,
    "Access-Control-Allow-Origin": allowOrigin,
  };
}

function json(data, request, env, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(request, env),
    },
  });
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function readStats(env) {
  const raw = await env.STATS.get("aggregate");
  if (!raw) {
    return { total: 0, days: {}, paths: {} };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      total: Number(parsed.total) || 0,
      days: parsed.days && typeof parsed.days === "object" ? parsed.days : {},
      paths: parsed.paths && typeof parsed.paths === "object" ? parsed.paths : {},
    };
  } catch {
    return { total: 0, days: {}, paths: {} };
  }
}

async function writeStats(env, stats) {
  await env.STATS.put("aggregate", JSON.stringify(stats));
}

function topPaths(paths, limit = 12) {
  return Object.entries(paths)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, count]) => ({ path, count }));
}

function recentDays(days, limit = 30) {
  return Object.entries(days)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, limit)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }));
}

function isAuthorized(request, env) {
  if (!env.STATS_SECRET) return false;
  const url = new URL(request.url);
  const headerToken = request.headers.get("X-Stats-Token");
  const queryToken = url.searchParams.get("token");
  return headerToken === env.STATS_SECRET || queryToken === env.STATS_SECRET;
}

function normalizeFavoritesToken(token) {
  if (typeof token !== "string") return "";
  const trimmed = token.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 128) return "";
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) return "";
  return trimmed;
}

async function readFavorites(env, token) {
  const raw = await env.STATS.get(`favorites:${token}`);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return {
      keys: Array.isArray(parsed.keys) ? parsed.keys.filter((k) => typeof k === "string") : [],
      records: Array.isArray(parsed.records) ? parsed.records : [],
      updatedAt: typeof parsed.updatedAt === "number" ? parsed.updatedAt : 0,
    };
  } catch {
    return null;
  }
}

async function writeFavorites(env, token, payload) {
  await env.STATS.put(`favorites:${token}`, JSON.stringify(payload));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    if (url.pathname === "/hit" && request.method === "POST") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const path = typeof body.path === "string" && body.path ? body.path.slice(0, 256) : "/";
      const stats = await readStats(env);
      const today = todayKey();

      stats.total += 1;
      stats.days[today] = (stats.days[today] || 0) + 1;
      stats.paths[path] = (stats.paths[path] || 0) + 1;

      const dayKeys = Object.keys(stats.days).sort();
      if (dayKeys.length > 120) {
        for (const key of dayKeys.slice(0, dayKeys.length - 120)) {
          delete stats.days[key];
        }
      }

      const pathKeys = Object.keys(stats.paths);
      if (pathKeys.length > 200) {
        const sorted = pathKeys.sort((a, b) => stats.paths[b] - stats.paths[a]).slice(0, 200);
        const trimmed = {};
        for (const key of sorted) trimmed[key] = stats.paths[key];
        stats.paths = trimmed;
      }

      await writeStats(env, stats);
      return json({ ok: true }, request, env);
    }

    if (url.pathname === "/stats" && request.method === "GET") {
      const stats = await readStats(env);
      const today = todayKey();
      const payload = {
        total: stats.total,
        today: stats.days[today] || 0,
        updatedAt: new Date().toISOString(),
      };

      if (isAuthorized(request, env)) {
        return json(
          {
            ...payload,
            days: recentDays(stats.days, 30),
            topPaths: topPaths(stats.paths, 12),
          },
          request,
          env
        );
      }

      return json(payload, request, env);
    }

    if (url.pathname === "/favorites" && request.method === "GET") {
      const token = normalizeFavoritesToken(url.searchParams.get("token"));
      if (!token) return json({ error: "Missing token" }, request, env, 400);

      const stored = await readFavorites(env, token);
      return json(stored || { keys: [], records: [], updatedAt: 0 }, request, env);
    }

    if (url.pathname === "/favorites" && request.method === "PUT") {
      let body = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const token = normalizeFavoritesToken(body.token ?? url.searchParams.get("token"));
      if (!token) return json({ error: "Missing token" }, request, env, 400);

      const keys = Array.isArray(body.keys)
        ? body.keys.filter((k) => typeof k === "string" && k.length > 0 && k.length < 240).slice(0, 2000)
        : [];
      const records = Array.isArray(body.records) ? body.records.slice(0, 2000) : [];
      const updatedAt = typeof body.updatedAt === "number" ? body.updatedAt : Date.now();

      const payload = { keys, records, updatedAt };
      await writeFavorites(env, token, payload);
      return json({ ok: true, count: keys.length, updatedAt }, request, env);
    }

    return json({ error: "Not found" }, request, env, 404);
  },
};
