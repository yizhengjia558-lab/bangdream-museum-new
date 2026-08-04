export type Gender = "male" | "female" | "other" | "unset";

export type CommunityUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
  signature: string;
  gender: Gender;
  createdAt?: number;
};

export type MediaItem = {
  id?: string;
  kind: "image" | "video";
  url: string;
  sort?: number;
};

export type ForumPostSummary = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  replyCount: number;
  author: CommunityUser;
  media: MediaItem[];
};

export type ForumReply = {
  id: string;
  body: string;
  createdAt: number;
  author: CommunityUser;
};

export type ForumPostDetail = {
  id: string;
  title: string;
  body: string;
  createdAt: number;
  updatedAt: number;
  author: CommunityUser;
  media: MediaItem[];
  replies: ForumReply[];
};

export type CardComment = {
  id: string;
  cardId: string;
  variant: "untrained" | "trained";
  body: string;
  createdAt: number;
  author: CommunityUser;
};

const TOKEN_KEY = "bd-community-token";

export function communityApiBase() {
  return process.env.NEXT_PUBLIC_COMMUNITY_API?.replace(/\/$/, "") ?? "";
}

export function isCommunityEnabled() {
  return Boolean(communityApiBase());
}

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

type ApiError = { error?: string };

async function request<T>(
  path: string,
  options: RequestInit & { token?: string | null; formData?: FormData } = {}
): Promise<T> {
  const base = communityApiBase();
  if (!base) throw new Error("Community API not configured");

  const headers = new Headers(options.headers || {});
  const token = options.token === undefined ? getStoredToken() : options.token;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.formData) {
    // let browser set multipart boundary
  } else if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${base}${path}`, {
    ...options,
    headers,
    body: options.formData ?? options.body,
    cache: "no-store",
  });

  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

export async function register(username: string, password: string) {
  return request<{ token: string; user: CommunityUser }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    token: null,
  });
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: CommunityUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
    token: null,
  });
}

export async function fetchMe(token?: string | null) {
  return request<{ user: CommunityUser }>("/auth/me", { token });
}

export async function updateMe(patch: {
  avatarUrl?: string | null;
  signature?: string;
  gender?: Gender;
}) {
  return request<{ user: CommunityUser }>("/auth/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function uploadMedia(file: File) {
  const form = new FormData();
  form.append("file", file);
  return request<{ url: string; kind: "image" | "video"; key: string }>("/upload", {
    method: "POST",
    formData: form,
  });
}

export async function listForumPosts(offset = 0, limit = 20) {
  return request<{ posts: ForumPostSummary[]; limit: number; offset: number }>(
    `/forum/posts?limit=${limit}&offset=${offset}`
  );
}

export async function createForumPost(input: {
  title: string;
  body: string;
  media?: MediaItem[];
}) {
  return request<{ id: string }>("/forum/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function getForumPost(id: string) {
  return request<{ post: ForumPostDetail }>(`/forum/posts/${id}`);
}

export async function replyForumPost(id: string, body: string) {
  return request<{ id: string }>(`/forum/posts/${id}/replies`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteForumPost(id: string) {
  return request<{ ok: boolean }>(`/forum/posts/${id}`, { method: "DELETE" });
}

export async function listCardComments(cardId: string, variant: "untrained" | "trained") {
  const q = new URLSearchParams({ variant });
  return request<{ comments: CardComment[] }>(`/cards/${encodeURIComponent(cardId)}/comments?${q}`);
}

export async function createCardComment(
  cardId: string,
  body: string,
  variant: "untrained" | "trained"
) {
  return request<{ id: string }>(`/cards/${encodeURIComponent(cardId)}/comments`, {
    method: "POST",
    body: JSON.stringify({ body, variant }),
  });
}

export async function deleteCardComment(id: string) {
  return request<{ ok: boolean }>(`/cards/comments/${id}`, { method: "DELETE" });
}

export type CommunityPublicStats = {
  users: number;
  posts: number;
  comments: number;
  views: number;
  todayViews: number;
  updatedAt?: string;
};

export async function fetchCommunityPublicStats(): Promise<CommunityPublicStats | null> {
  const base = communityApiBase();
  if (!base) return null;
  try {
    const res = await fetch(`${base}/stats`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<CommunityPublicStats>;
    return {
      users: Number(data.users) || 0,
      posts: Number(data.posts) || 0,
      comments: Number(data.comments) || 0,
      views: Number(data.views) || 0,
      todayViews: Number(data.todayViews) || 0,
      updatedAt: data.updatedAt,
    };
  } catch {
    return null;
  }
}

export async function recordCommunityVisit(path: string) {
  const base = communityApiBase();
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

export type WallComment = {
  id: string;
  characterId: number;
  body: string;
  createdAt: number;
  author: CommunityUser;
};

export async function listCharacterWall(characterId: number, limit = 50) {
  return request<{ comments: WallComment[] }>(
    `/characters/${characterId}/wall?limit=${limit}`
  );
}

export async function createCharacterWallComment(characterId: number, body: string) {
  return request<{ id: string }>(`/characters/${characterId}/wall`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export async function deleteCharacterWallComment(id: string) {
  return request<{ ok: boolean }>(`/characters/wall/${id}`, { method: "DELETE" });
}

export async function recordCardView(
  cardId: string,
  meta: { characterId?: number; bandFolder?: string } = {}
) {
  const base = communityApiBase();
  if (!base || typeof window === "undefined") return null;
  try {
    const res = await fetch(`${base}/cards/${encodeURIComponent(cardId)}/view`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        characterId: meta.characterId ?? 0,
        bandFolder: meta.bandFolder ?? "",
      }),
      keepalive: true,
    });
    if (!res.ok) return null;
    return (await res.json()) as { ok: boolean; views: number };
  } catch {
    return null;
  }
}

export type TopCardEntry = { cardId: string; views: number };

export async function fetchCharacterTopCards(
  characterId: number,
  options: { limit?: number; month?: string } = {}
) {
  const q = new URLSearchParams();
  if (options.limit) q.set("limit", String(options.limit));
  if (options.month) q.set("month", options.month);
  const qs = q.toString();
  return request<{ cards: TopCardEntry[] }>(
    `/characters/${characterId}/top-cards${qs ? `?${qs}` : ""}`
  );
}

export type TopCharacterEntry = { characterId: number; views: number };

export async function fetchBandTopCharacters(
  bandFolder: string,
  options: { limit?: number; month?: string } = {}
) {
  const q = new URLSearchParams();
  if (options.limit) q.set("limit", String(options.limit));
  if (options.month) q.set("month", options.month);
  const qs = q.toString();
  return request<{ characters: TopCharacterEntry[] }>(
    `/bands/${encodeURIComponent(bandFolder)}/top-characters${qs ? `?${qs}` : ""}`
  );
}

export type ChampionshipPayload = {
  month: string;
  isFinal: boolean;
  characterCardChamps: {
    characterId: number;
    cardId: string;
    bandFolder: string;
    views: number;
  }[];
  bandCharacterChamps: {
    bandFolder: string;
    characterId: number;
    views: number;
  }[];
};

export async function fetchMonthlyChampionship(month?: string) {
  const q = month ? `?month=${encodeURIComponent(month)}` : "";
  return request<ChampionshipPayload>(`/championship${q}`);
}
