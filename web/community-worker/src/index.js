/**
 * BanG Dream! community API — auth, forum, card comments, media upload.
 * @typedef {{ DB: D1Database; MEDIA: R2Bucket; JWT_SECRET?: string; ALLOWED_ORIGINS?: string }} Env
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const USERNAME_RE = /^[a-zA-Z0-9_\u4e00-\u9fff]{3,24}$/;
const GENDERS = new Set(["male", "female", "other", "unset"]);
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm"]);
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_VIDEO = 50 * 1024 * 1024;
const MAX_TITLE = 120;
const MAX_BODY = 5000;
const MAX_COMMENT = 1000;
const MAX_SIGNATURE = 120;
const MAX_MEDIA_PER_POST = 6;
const PBKDF2_ITERATIONS = 100000;
const JWT_TTL_SEC = 60 * 60 * 24 * 30;

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = (env.ALLOWED_ORIGINS ?? "*")
    .split(",")
    .map((v) => v.trim())
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

function error(message, request, env, status = 400) {
  return json({ error: message }, request, env, status);
}

function id() {
  return crypto.randomUUID().replace(/-/g, "");
}

function b64url(bytes) {
  let str = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlFromStr(str) {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function strFromB64url(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(escape(atob(raw)));
}

function bytesFromB64url(b64) {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = (b64 + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(raw);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function getJwtKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signJwt(payload, secret) {
  const header = b64urlFromStr(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64urlFromStr(JSON.stringify(payload));
  const data = `${header}.${body}`;
  const key = await getJwtKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${b64url(sig)}`;
}

async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await getJwtKey(secret);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    bytesFromB64url(sig),
    new TextEncoder().encode(`${header}.${body}`)
  );
  if (!ok) return null;
  try {
    const payload = JSON.parse(strFromB64url(body));
    if (!payload || typeof payload !== "object") return null;
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function hashPassword(password, saltB64) {
  const salt = saltB64 ? bytesFromB64url(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITERATIONS, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: b64url(bits), salt: b64url(salt) };
}

function publicUser(row) {
  return {
    id: row.id,
    username: row.username,
    avatarUrl: row.avatar_url || null,
    signature: row.signature || "",
    gender: row.gender || "unset",
    createdAt: row.created_at,
  };
}

async function requireUser(request, env) {
  if (!env.JWT_SECRET) return { error: error("Server misconfigured", request, env, 500) };
  const auth = request.headers.get("Authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return { error: error("Unauthorized", request, env, 401) };
  const payload = await verifyJwt(token, env.JWT_SECRET);
  if (!payload?.sub) return { error: error("Unauthorized", request, env, 401) };
  const row = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(payload.sub).first();
  if (!row) return { error: error("Unauthorized", request, env, 401) };
  return { user: row };
}

async function issueToken(env, user) {
  const now = Math.floor(Date.now() / 1000);
  const token = await signJwt({ sub: user.id, username: user.username, iat: now, exp: now + JWT_TTL_SEC }, env.JWT_SECRET);
  return { token, user: publicUser(user) };
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function mediaPublicUrl(request, key) {
  const url = new URL(request.url);
  return `${url.origin}/media/${encodeURIComponent(key)}`;
}

function mapMediaRows(rows) {
  return (rows || []).map((m) => ({
    id: m.id,
    kind: m.kind,
    url: m.url,
    sort: m.sort,
  }));
}

async function handleRegister(request, env) {
  if (!env.JWT_SECRET) return error("Server misconfigured: set JWT_SECRET", request, env, 500);
  const body = await readJson(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!USERNAME_RE.test(username)) {
    return error("Username must be 3–24 letters, numbers, underscore, or Chinese characters", request, env);
  }
  if (password.length < 6 || password.length > 72) {
    return error("Password must be 6–72 characters", request, env);
  }
  const existing = await env.DB.prepare("SELECT id FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();
  if (existing) return error("Username already taken", request, env, 409);

  const { hash, salt } = await hashPassword(password);
  const userId = id();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, username, password_hash, password_salt, avatar_url, signature, gender, created_at)
     VALUES (?, ?, ?, ?, NULL, '', 'unset', ?)`
  )
    .bind(userId, username, hash, salt, now)
    .run();

  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(userId).first();
  return json(await issueToken(env, user), request, env, 201);
}

async function handleLogin(request, env) {
  if (!env.JWT_SECRET) return error("Server misconfigured: set JWT_SECRET", request, env, 500);
  const body = await readJson(request);
  const username = typeof body?.username === "string" ? body.username.trim() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  if (!username || !password) return error("Username and password required", request, env);

  const user = await env.DB.prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .bind(username)
    .first();
  if (!user) return error("Invalid username or password", request, env, 401);

  const { hash } = await hashPassword(password, user.password_salt);
  if (hash !== user.password_hash) return error("Invalid username or password", request, env, 401);

  return json(await issueToken(env, user), request, env);
}

async function handleMeGet(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  return json({ user: publicUser(auth.user) }, request, env);
}

async function handleMePatch(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const body = await readJson(request);
  if (!body || typeof body !== "object") return error("Invalid body", request, env);

  let avatarUrl = auth.user.avatar_url;
  let signature = auth.user.signature;
  let gender = auth.user.gender;

  if ("avatarUrl" in body) {
    if (body.avatarUrl === null || body.avatarUrl === "") avatarUrl = null;
    else if (typeof body.avatarUrl === "string" && body.avatarUrl.length < 2000) avatarUrl = body.avatarUrl;
    else return error("Invalid avatarUrl", request, env);
  }
  if ("signature" in body) {
    if (typeof body.signature !== "string" || body.signature.length > MAX_SIGNATURE) {
      return error(`Signature max ${MAX_SIGNATURE} chars`, request, env);
    }
    signature = body.signature.trim();
  }
  if ("gender" in body) {
    if (!GENDERS.has(body.gender)) return error("Invalid gender", request, env);
    gender = body.gender;
  }

  await env.DB.prepare("UPDATE users SET avatar_url = ?, signature = ?, gender = ? WHERE id = ?")
    .bind(avatarUrl, signature, gender, auth.user.id)
    .run();

  const user = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(auth.user.id).first();
  return json({ user: publicUser(user) }, request, env);
}

async function handleUpload(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  if (!env.MEDIA) return error("Media storage not configured", request, env, 500);

  const form = await request.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") return error("file required", request, env);

  const type = file.type || "application/octet-stream";
  const size = file.size || 0;
  let kind = null;
  if (IMAGE_TYPES.has(type) && size <= MAX_IMAGE) kind = "image";
  else if (VIDEO_TYPES.has(type) && size <= MAX_VIDEO) kind = "video";
  else {
    return error("Unsupported file (images ≤5MB jpeg/png/webp/gif; videos ≤50MB mp4/webm)", request, env);
  }

  const ext =
    type === "image/jpeg"
      ? "jpg"
      : type === "image/png"
        ? "png"
        : type === "image/webp"
          ? "webp"
          : type === "image/gif"
            ? "gif"
            : type === "video/webm"
              ? "webm"
              : "mp4";

  const key = `u/${auth.user.id}/${Date.now()}-${id().slice(0, 10)}.${ext}`;
  await env.MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: type },
    customMetadata: { userId: auth.user.id, kind },
  });

  return json({ url: mediaPublicUrl(request, key), kind, key }, request, env, 201);
}

async function handleMediaGet(request, env, key) {
  if (!env.MEDIA) return error("Not found", request, env, 404);
  const decoded = decodeURIComponent(key);
  if (decoded.includes("..")) return error("Not found", request, env, 404);
  const obj = await env.MEDIA.get(decoded);
  if (!obj) return error("Not found", request, env, 404);
  const headers = new Headers(corsHeaders(request, env));
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  return new Response(obj.body, { headers });
}

async function handleForumList(request, env) {
  const url = new URL(request.url);
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get("limit")) || 20));
  const offset = Math.max(0, Number(url.searchParams.get("offset")) || 0);

  const rows = await env.DB.prepare(
    `SELECT p.*, u.username, u.avatar_url, u.signature, u.gender,
            (SELECT COUNT(*) FROM post_replies r WHERE r.post_id = p.id) AS reply_count
     FROM posts p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC
     LIMIT ? OFFSET ?`
  )
    .bind(limit, offset)
    .all();

  const posts = [];
  for (const row of rows.results || []) {
    const media = await env.DB.prepare("SELECT * FROM post_media WHERE post_id = ? ORDER BY sort ASC")
      .bind(row.id)
      .all();
    posts.push({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      replyCount: row.reply_count || 0,
      author: {
        id: row.user_id,
        username: row.username,
        avatarUrl: row.avatar_url || null,
        signature: row.signature || "",
        gender: row.gender || "unset",
      },
      media: mapMediaRows(media.results),
    });
  }

  return json({ posts, limit, offset }, request, env);
}

async function handleForumCreate(request, env) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const body = await readJson(request);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const media = Array.isArray(body?.media) ? body.media : [];

  if (!title || title.length > MAX_TITLE) return error(`Title required (max ${MAX_TITLE})`, request, env);
  if (!text || text.length > MAX_BODY) return error(`Body required (max ${MAX_BODY})`, request, env);
  if (media.length > MAX_MEDIA_PER_POST) return error(`Max ${MAX_MEDIA_PER_POST} media items`, request, env);

  for (const m of media) {
    if (!m || (m.kind !== "image" && m.kind !== "video") || typeof m.url !== "string" || !m.url) {
      return error("Invalid media item", request, env);
    }
  }

  const postId = id();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO posts (id, user_id, title, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(postId, auth.user.id, title, text, now, now)
    .run();

  let sort = 0;
  for (const m of media) {
    await env.DB.prepare(`INSERT INTO post_media (id, post_id, kind, url, sort) VALUES (?, ?, ?, ?, ?)`)
      .bind(id(), postId, m.kind, m.url, sort++)
      .run();
  }

  return json({ id: postId }, request, env, 201);
}

async function handleForumDetail(request, env, postId) {
  const row = await env.DB.prepare(
    `SELECT p.*, u.username, u.avatar_url, u.signature, u.gender
     FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?`
  )
    .bind(postId)
    .first();
  if (!row) return error("Not found", request, env, 404);

  const media = await env.DB.prepare("SELECT * FROM post_media WHERE post_id = ? ORDER BY sort ASC")
    .bind(postId)
    .all();
  const replies = await env.DB.prepare(
    `SELECT r.*, u.username, u.avatar_url, u.signature, u.gender
     FROM post_replies r JOIN users u ON u.id = r.user_id
     WHERE r.post_id = ? ORDER BY r.created_at ASC`
  )
    .bind(postId)
    .all();

  return json(
    {
      post: {
        id: row.id,
        title: row.title,
        body: row.body,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        author: {
          id: row.user_id,
          username: row.username,
          avatarUrl: row.avatar_url || null,
          signature: row.signature || "",
          gender: row.gender || "unset",
        },
        media: mapMediaRows(media.results),
        replies: (replies.results || []).map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.created_at,
          author: {
            id: r.user_id,
            username: r.username,
            avatarUrl: r.avatar_url || null,
            signature: r.signature || "",
            gender: r.gender || "unset",
          },
        })),
      },
    },
    request,
    env
  );
}

async function handleForumReply(request, env, postId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const post = await env.DB.prepare("SELECT id FROM posts WHERE id = ?").bind(postId).first();
  if (!post) return error("Not found", request, env, 404);

  const body = await readJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > MAX_BODY) return error(`Reply required (max ${MAX_BODY})`, request, env);

  const replyId = id();
  const now = Date.now();
  await env.DB.prepare(`INSERT INTO post_replies (id, post_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)`)
    .bind(replyId, postId, auth.user.id, text, now)
    .run();
  await env.DB.prepare("UPDATE posts SET updated_at = ? WHERE id = ?").bind(now, postId).run();

  return json({ id: replyId }, request, env, 201);
}

async function handleForumDelete(request, env, postId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(postId).first();
  if (!post) return error("Not found", request, env, 404);
  if (post.user_id !== auth.user.id) return error("Forbidden", request, env, 403);

  await env.DB.prepare("DELETE FROM post_media WHERE post_id = ?").bind(postId).run();
  await env.DB.prepare("DELETE FROM post_replies WHERE post_id = ?").bind(postId).run();
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(postId).run();
  return json({ ok: true }, request, env);
}

async function handleCardCommentsList(request, env, cardId) {
  const url = new URL(request.url);
  const variant = url.searchParams.get("variant") === "trained" ? "trained" : "untrained";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit")) || 50));

  const rows = await env.DB.prepare(
    `SELECT c.*, u.username, u.avatar_url, u.signature, u.gender
     FROM card_comments c JOIN users u ON u.id = c.user_id
     WHERE c.card_id = ? AND c.variant = ?
     ORDER BY c.created_at DESC
     LIMIT ?`
  )
    .bind(cardId, variant, limit)
    .all();

  return json(
    {
      comments: (rows.results || []).map((c) => ({
        id: c.id,
        cardId: c.card_id,
        variant: c.variant,
        body: c.body,
        createdAt: c.created_at,
        author: {
          id: c.user_id,
          username: c.username,
          avatarUrl: c.avatar_url || null,
          signature: c.signature || "",
          gender: c.gender || "unset",
        },
      })),
    },
    request,
    env
  );
}

async function handleCardCommentCreate(request, env, cardId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  if (!cardId || cardId.length > 120) return error("Invalid card id", request, env);

  const body = await readJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  const variant = body?.variant === "trained" ? "trained" : "untrained";
  if (!text || text.length > MAX_COMMENT) return error(`Comment required (max ${MAX_COMMENT})`, request, env);

  const commentId = id();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO card_comments (id, card_id, variant, user_id, body, created_at) VALUES (?, ?, ?, ?, ?, ?)`
  )
    .bind(commentId, cardId, variant, auth.user.id, text, now)
    .run();

  return json({ id: commentId }, request, env, 201);
}

async function handleCardCommentDelete(request, env, commentId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const row = await env.DB.prepare("SELECT * FROM card_comments WHERE id = ?").bind(commentId).first();
  if (!row) return error("Not found", request, env, 404);
  if (row.user_id !== auth.user.id) return error("Forbidden", request, env, 403);
  await env.DB.prepare("DELETE FROM card_comments WHERE id = ?").bind(commentId).run();
  return json({ ok: true }, request, env);
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

async function handleHit(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const path = typeof body.path === "string" && body.path ? body.path.slice(0, 256) : "/";
  const day = todayKey();

  await env.DB.prepare(
    `INSERT INTO site_meta (key, value) VALUES ('total_views', 1)
     ON CONFLICT(key) DO UPDATE SET value = value + 1`
  ).run();
  await env.DB.prepare(
    `INSERT INTO page_views_daily (day, count) VALUES (?, 1)
     ON CONFLICT(day) DO UPDATE SET count = count + 1`
  )
    .bind(day)
    .run();

  return json({ ok: true, path }, request, env);
}

async function handlePublicStats(request, env) {
  const usersRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM users").first();
  const postsRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM posts").first();
  const commentsRow = await env.DB.prepare("SELECT COUNT(*) AS c FROM card_comments").first();
  const viewsRow = await env.DB.prepare("SELECT value AS c FROM site_meta WHERE key = 'total_views'").first();
  const todayRow = await env.DB.prepare("SELECT count AS c FROM page_views_daily WHERE day = ?")
    .bind(todayKey())
    .first();

  return json(
    {
      users: Number(usersRow?.c) || 0,
      posts: Number(postsRow?.c) || 0,
      comments: Number(commentsRow?.c) || 0,
      views: Number(viewsRow?.c) || 0,
      todayViews: Number(todayRow?.c) || 0,
      updatedAt: new Date().toISOString(),
    },
    request,
    env
  );
}

function monthKey(date = new Date()) {
  return date.toISOString().slice(0, 7);
}

function previousMonthKey() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - 1);
  return d.toISOString().slice(0, 7);
}

async function handleCharacterWallList(request, env, characterId) {
  const cid = Number(characterId);
  if (!Number.isFinite(cid) || cid <= 0) return error("Invalid character id", request, env);
  const limit = Math.min(100, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 50));
  const rows = await env.DB.prepare(
    `SELECT w.*, u.username, u.avatar_url, u.signature, u.gender
     FROM character_wall w JOIN users u ON u.id = w.user_id
     WHERE w.character_id = ?
     ORDER BY w.created_at DESC
     LIMIT ?`
  )
    .bind(cid, limit)
    .all();

  return json(
    {
      comments: (rows.results || []).map((c) => ({
        id: c.id,
        characterId: c.character_id,
        body: c.body,
        createdAt: c.created_at,
        author: {
          id: c.user_id,
          username: c.username,
          avatarUrl: c.avatar_url || null,
          signature: c.signature || "",
          gender: c.gender || "unset",
        },
      })),
    },
    request,
    env
  );
}

async function handleCharacterWallCreate(request, env, characterId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const cid = Number(characterId);
  if (!Number.isFinite(cid) || cid <= 0) return error("Invalid character id", request, env);
  const body = await readJson(request);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > MAX_COMMENT) return error(`Comment required (max ${MAX_COMMENT})`, request, env);

  const commentId = id();
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO character_wall (id, character_id, user_id, body, created_at) VALUES (?, ?, ?, ?, ?)`
  )
    .bind(commentId, cid, auth.user.id, text, now)
    .run();
  return json({ id: commentId }, request, env, 201);
}

async function handleCharacterWallDelete(request, env, commentId) {
  const auth = await requireUser(request, env);
  if (auth.error) return auth.error;
  const row = await env.DB.prepare("SELECT * FROM character_wall WHERE id = ?").bind(commentId).first();
  if (!row) return error("Not found", request, env, 404);
  if (row.user_id !== auth.user.id) return error("Forbidden", request, env, 403);
  await env.DB.prepare("DELETE FROM character_wall WHERE id = ?").bind(commentId).run();
  return json({ ok: true }, request, env);
}

async function handleCardView(request, env, cardId) {
  if (!cardId || cardId.length > 120) return error("Invalid card id", request, env);
  const body = await readJson(request);
  const characterId = Number(body?.characterId) || 0;
  const bandFolder = typeof body?.bandFolder === "string" ? body.bandFolder.slice(0, 64) : "";
  const month = monthKey();

  await env.DB.prepare(
    `INSERT INTO card_views (card_id, character_id, band_folder, views) VALUES (?, ?, ?, 1)
     ON CONFLICT(card_id) DO UPDATE SET
       views = views + 1,
       character_id = CASE WHEN excluded.character_id > 0 THEN excluded.character_id ELSE card_views.character_id END,
       band_folder = CASE WHEN excluded.band_folder != '' THEN excluded.band_folder ELSE card_views.band_folder END`
  )
    .bind(cardId, characterId, bandFolder)
    .run();

  await env.DB.prepare(
    `INSERT INTO card_views_monthly (card_id, month, character_id, band_folder, views) VALUES (?, ?, ?, ?, 1)
     ON CONFLICT(card_id, month) DO UPDATE SET
       views = views + 1,
       character_id = CASE WHEN excluded.character_id > 0 THEN excluded.character_id ELSE card_views_monthly.character_id END,
       band_folder = CASE WHEN excluded.band_folder != '' THEN excluded.band_folder ELSE card_views_monthly.band_folder END`
  )
    .bind(cardId, month, characterId, bandFolder)
    .run();

  const row = await env.DB.prepare("SELECT views FROM card_views WHERE card_id = ?").bind(cardId).first();
  return json({ ok: true, views: Number(row?.views) || 1 }, request, env);
}

async function handleCharacterTopCards(request, env, characterId) {
  const cid = Number(characterId);
  if (!Number.isFinite(cid) || cid <= 0) return error("Invalid character id", request, env);
  const url = new URL(request.url);
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get("limit")) || 3));
  const month = url.searchParams.get("month");

  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    rows = await env.DB.prepare(
      `SELECT card_id, views FROM card_views_monthly
       WHERE character_id = ? AND month = ?
       ORDER BY views DESC LIMIT ?`
    )
      .bind(cid, month, limit)
      .all();
  } else {
    rows = await env.DB.prepare(
      `SELECT card_id, views FROM card_views
       WHERE character_id = ?
       ORDER BY views DESC LIMIT ?`
    )
      .bind(cid, limit)
      .all();
  }

  return json(
    {
      cards: (rows.results || []).map((r) => ({
        cardId: r.card_id,
        views: Number(r.views) || 0,
      })),
    },
    request,
    env
  );
}

async function handleBandTopCharacters(request, env, bandFolder) {
  const folder = decodeURIComponent(bandFolder || "").slice(0, 64);
  if (!folder) return error("Invalid band", request, env);
  const url = new URL(request.url);
  const limit = Math.min(12, Math.max(1, Number(url.searchParams.get("limit")) || 3));
  const month = url.searchParams.get("month");

  let rows;
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    rows = await env.DB.prepare(
      `SELECT character_id, SUM(views) AS views
       FROM card_views_monthly
       WHERE band_folder = ? AND month = ? AND character_id > 0
       GROUP BY character_id
       ORDER BY views DESC LIMIT ?`
    )
      .bind(folder, month, limit)
      .all();
  } else {
    rows = await env.DB.prepare(
      `SELECT character_id, SUM(views) AS views
       FROM card_views
       WHERE band_folder = ? AND character_id > 0
       GROUP BY character_id
       ORDER BY views DESC LIMIT ?`
    )
      .bind(folder, limit)
      .all();
  }

  return json(
    {
      characters: (rows.results || []).map((r) => ({
        characterId: Number(r.character_id),
        views: Number(r.views) || 0,
      })),
    },
    request,
    env
  );
}

async function handleMonthlyChampionship(request, env) {
  const url = new URL(request.url);
  const now = new Date();
  const day = now.getUTCDate();
  // From the 28th onward, highlight previous month as "champions"; otherwise current month leaders.
  const defaultMonth = day >= 28 ? previousMonthKey() : monthKey();
  const month = /^\d{4}-\d{2}$/.test(url.searchParams.get("month") || "")
    ? url.searchParams.get("month")
    : defaultMonth;

  const cardChamps = await env.DB.prepare(
    `SELECT cvm.character_id, cvm.card_id, cvm.views, cvm.band_folder
     FROM card_views_monthly cvm
     INNER JOIN (
       SELECT character_id, MAX(views) AS max_views
       FROM card_views_monthly
       WHERE month = ? AND character_id > 0
       GROUP BY character_id
     ) best ON best.character_id = cvm.character_id AND best.max_views = cvm.views
     WHERE cvm.month = ?
     ORDER BY cvm.views DESC`
  )
    .bind(month, month)
    .all();

  const bandChamps = await env.DB.prepare(
    `SELECT band_folder, character_id, SUM(views) AS views
     FROM card_views_monthly
     WHERE month = ? AND band_folder != '' AND character_id > 0
     GROUP BY band_folder, character_id`
  )
    .bind(month)
    .all();

  /** @type {Map<string, { characterId: number, views: number }>} */
  const bandBest = new Map();
  for (const row of bandChamps.results || []) {
    const folder = row.band_folder;
    const entry = { characterId: Number(row.character_id), views: Number(row.views) || 0 };
    const prev = bandBest.get(folder);
    if (!prev || entry.views > prev.views) bandBest.set(folder, entry);
  }

  // Deduplicate character champs if multiple cards tie — keep first (highest views order)
  const seenChar = new Set();
  const characterCardChamps = [];
  for (const row of cardChamps.results || []) {
    const cid = Number(row.character_id);
    if (seenChar.has(cid)) continue;
    seenChar.add(cid);
    characterCardChamps.push({
      characterId: cid,
      cardId: row.card_id,
      bandFolder: row.band_folder || "",
      views: Number(row.views) || 0,
    });
  }

  return json(
    {
      month,
      isFinal: day >= 28 || month === previousMonthKey(),
      characterCardChamps,
      bandCharacterChamps: [...bandBest.entries()].map(([bandFolder, v]) => ({
        bandFolder,
        characterId: v.characterId,
        views: v.views,
      })),
    },
    request,
    env
  );
}

export default {
  /** @param {Request} request @param {Env} env */
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    try {
      if (url.pathname === "/health" && request.method === "GET") {
        return json({ ok: true }, request, env);
      }

      if (url.pathname === "/hit" && request.method === "POST") {
        return handleHit(request, env);
      }

      if (url.pathname === "/stats" && request.method === "GET") {
        return handlePublicStats(request, env);
      }

      if (url.pathname.startsWith("/media/") && request.method === "GET") {
        return handleMediaGet(request, env, url.pathname.slice("/media/".length));
      }

      if (url.pathname === "/auth/register" && request.method === "POST") {
        return handleRegister(request, env);
      }
      if (url.pathname === "/auth/login" && request.method === "POST") {
        return handleLogin(request, env);
      }
      if (url.pathname === "/auth/me" && request.method === "GET") {
        return handleMeGet(request, env);
      }
      if (url.pathname === "/auth/me" && request.method === "PATCH") {
        return handleMePatch(request, env);
      }

      if (url.pathname === "/upload" && request.method === "POST") {
        return handleUpload(request, env);
      }

      if (url.pathname === "/forum/posts" && request.method === "GET") {
        return handleForumList(request, env);
      }
      if (url.pathname === "/forum/posts" && request.method === "POST") {
        return handleForumCreate(request, env);
      }

      const postMatch = url.pathname.match(/^\/forum\/posts\/([a-zA-Z0-9]+)$/);
      if (postMatch && request.method === "GET") {
        return handleForumDetail(request, env, postMatch[1]);
      }
      if (postMatch && request.method === "DELETE") {
        return handleForumDelete(request, env, postMatch[1]);
      }

      const replyMatch = url.pathname.match(/^\/forum\/posts\/([a-zA-Z0-9]+)\/replies$/);
      if (replyMatch && request.method === "POST") {
        return handleForumReply(request, env, replyMatch[1]);
      }

      const cardCommentsMatch = url.pathname.match(/^\/cards\/([^/]+)\/comments$/);
      if (cardCommentsMatch && request.method === "GET") {
        return handleCardCommentsList(request, env, decodeURIComponent(cardCommentsMatch[1]));
      }
      if (cardCommentsMatch && request.method === "POST") {
        return handleCardCommentCreate(request, env, decodeURIComponent(cardCommentsMatch[1]));
      }

      const commentDeleteMatch = url.pathname.match(/^\/cards\/comments\/([a-zA-Z0-9]+)$/);
      if (commentDeleteMatch && request.method === "DELETE") {
        return handleCardCommentDelete(request, env, commentDeleteMatch[1]);
      }

      const wallMatch = url.pathname.match(/^\/characters\/(\d+)\/wall$/);
      if (wallMatch && request.method === "GET") {
        return handleCharacterWallList(request, env, wallMatch[1]);
      }
      if (wallMatch && request.method === "POST") {
        return handleCharacterWallCreate(request, env, wallMatch[1]);
      }

      const wallDeleteMatch = url.pathname.match(/^\/characters\/wall\/([a-zA-Z0-9]+)$/);
      if (wallDeleteMatch && request.method === "DELETE") {
        return handleCharacterWallDelete(request, env, wallDeleteMatch[1]);
      }

      const cardViewMatch = url.pathname.match(/^\/cards\/([^/]+)\/view$/);
      if (cardViewMatch && request.method === "POST") {
        return handleCardView(request, env, decodeURIComponent(cardViewMatch[1]));
      }

      const charTopCardsMatch = url.pathname.match(/^\/characters\/(\d+)\/top-cards$/);
      if (charTopCardsMatch && request.method === "GET") {
        return handleCharacterTopCards(request, env, charTopCardsMatch[1]);
      }

      const bandTopCharsMatch = url.pathname.match(/^\/bands\/([^/]+)\/top-characters$/);
      if (bandTopCharsMatch && request.method === "GET") {
        return handleBandTopCharacters(request, env, bandTopCharsMatch[1]);
      }

      if (url.pathname === "/championship" && request.method === "GET") {
        return handleMonthlyChampionship(request, env);
      }

      return error("Not found", request, env, 404);
    } catch (err) {
      console.error(err);
      return error("Internal error", request, env, 500);
    }
  },
};
