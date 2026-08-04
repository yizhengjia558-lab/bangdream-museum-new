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
