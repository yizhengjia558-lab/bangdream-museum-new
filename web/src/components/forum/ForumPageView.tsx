"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserAvatar } from "@/components/auth/AuthModal";
import { BandBackButton } from "@/components/bands/BandBackButton";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  createForumPost,
  deleteForumPost,
  getForumPost,
  isCommunityEnabled,
  listForumPosts,
  replyForumPost,
  uploadMedia,
  type ForumPostDetail,
  type ForumPostSummary,
  type MediaItem,
} from "@/lib/community-api";

function formatTime(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN");
  } catch {
    return new Date(ts).toLocaleString();
  }
}

function MediaGallery({ media }: { media: MediaItem[] }) {
  if (!media.length) return null;
  return (
    <div className="forum-media-grid">
      {media.map((m, i) =>
        m.kind === "video" ? (
          <video key={m.url + i} src={m.url} controls className="forum-media-video" preload="metadata" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m.url + i} src={m.url} alt="" className="forum-media-image" />
        )
      )}
    </div>
  );
}

export function ForumPageView() {
  const { t, locale } = useLocale();
  const { enabled, user, requireAuth } = useAuth();
  const [posts, setPosts] = useState<ForumPostSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ForumPostDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");

  const loadPosts = useCallback(async () => {
    if (!isCommunityEnabled()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await listForumPosts(0, 30);
      setPosts(res.posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("forum.loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    getForumPost(selectedId)
      .then((res) => {
        if (!cancelled) setDetail(res.post);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function onUploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setFormError("");
    setBusy(true);
    try {
      const next = [...media];
      for (const file of Array.from(files)) {
        if (next.length >= 6) break;
        const res = await uploadMedia(file);
        next.push({ kind: res.kind, url: res.url });
      }
      setMedia(next);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("auth.uploadError"));
    } finally {
      setBusy(false);
    }
  }

  async function onCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    setBusy(true);
    setFormError("");
    try {
      const res = await createForumPost({ title: title.trim(), body: body.trim(), media });
      setComposing(false);
      setTitle("");
      setBody("");
      setMedia([]);
      await loadPosts();
      setSelectedId(res.id);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("forum.postError"));
    } finally {
      setBusy(false);
    }
  }

  async function onReply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !requireAuth()) return;
    setBusy(true);
    setFormError("");
    try {
      await replyForumPost(selectedId, reply.trim());
      setReply("");
      const res = await getForumPost(selectedId);
      setDetail(res.post);
      await loadPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("forum.replyError"));
    } finally {
      setBusy(false);
    }
  }

  async function onDeletePost(id: string) {
    if (!requireAuth()) return;
    if (!window.confirm(t("forum.deleteConfirm"))) return;
    setBusy(true);
    try {
      await deleteForumPost(id);
      if (selectedId === id) setSelectedId(null);
      await loadPosts();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t("forum.deleteError"));
    } finally {
      setBusy(false);
    }
  }

  if (!enabled) {
    return (
      <>
        <BandBackButton color="#e9435e" fallbackHref="/" />
        <section className="page-section relative pt-28 pb-20">
          <div className="relative page-container">
            <SectionHeading title={t("forum.title")} subtitle={t("forum.subtitle")} />
            <GlassPanel className="p-10 text-center">
              <p className="text-[var(--text-secondary)]">{t("forum.disabled")}</p>
            </GlassPanel>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <BandBackButton color="#e9435e" fallbackHref="/" />
      <section className="page-section relative pt-28 pb-20">
        <div className="pointer-events-none absolute inset-0 bloom-layer opacity-50" aria-hidden />
        <div className="relative page-container">
          <SectionHeading title={t("forum.title")} subtitle={t("forum.subtitle")} />

          <div className="forum-toolbar mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-[var(--text-secondary)]">
              {t("forum.count").replace("{count}", String(posts.length))}
            </p>
            <GlassButton
              onClick={() => {
                if (!requireAuth(() => setComposing(true))) return;
                setComposing(true);
              }}
            >
              {t("forum.newPost")}
            </GlassButton>
          </div>

          {composing && (
            <GlassPanel className="forum-compose mb-8 p-6 sm:p-8">
              <h3 className="forum-section-title">{t("forum.composeTitle")}</h3>
              <form className="forum-form mt-4" onSubmit={onCreatePost}>
                <label className="auth-field">
                  <span>{t("forum.postTitle")}</span>
                  <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} />
                </label>
                <label className="auth-field">
                  <span>{t("forum.postBody")}</span>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    maxLength={5000}
                    rows={5}
                  />
                </label>
                <div className="forum-upload-row">
                  <label className="auth-file-label">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
                      multiple
                      hidden
                      disabled={busy || media.length >= 6}
                      onChange={(e) => onUploadFiles(e.target.files)}
                    />
                    {t("forum.addMedia")}
                  </label>
                  <span className="text-xs text-[var(--text-muted)]">{t("forum.mediaHint")}</span>
                </div>
                <MediaGallery media={media} />
                {formError && <p className="auth-error">{formError}</p>}
                <div className="auth-actions">
                  <GlassButton type="submit" disabled={busy}>
                    {busy ? t("auth.working") : t("forum.publish")}
                  </GlassButton>
                  <GlassButton
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setComposing(false);
                      setFormError("");
                    }}
                  >
                    {t("forum.cancel")}
                  </GlassButton>
                </div>
              </form>
            </GlassPanel>
          )}

          {selectedId ? (
            <GlassPanel className="forum-detail mb-8 p-6 sm:p-8">
              <button type="button" className="auth-text-btn mb-4" onClick={() => setSelectedId(null)}>
                ← {t("forum.backToList")}
              </button>
              {detailLoading || !detail ? (
                <p className="text-[var(--text-secondary)]">…</p>
              ) : (
                <>
                  <div className="forum-post-header">
                    <UserAvatar
                      username={detail.author.username}
                      avatarUrl={detail.author.avatarUrl}
                      size={44}
                    />
                    <div>
                      <h2 className="forum-post-title">{detail.title}</h2>
                      <p className="forum-meta">
                        {detail.author.username}
                        {detail.author.signature ? ` · ${detail.author.signature}` : ""}
                        {" · "}
                        {formatTime(detail.createdAt, locale)}
                      </p>
                    </div>
                    {user?.id === detail.author.id && (
                      <GlassButton
                        variant="ghost"
                        className="ml-auto"
                        disabled={busy}
                        onClick={() => onDeletePost(detail.id)}
                      >
                        {t("forum.delete")}
                      </GlassButton>
                    )}
                  </div>
                  <p className="forum-body mt-4 whitespace-pre-wrap">{detail.body}</p>
                  <MediaGallery media={detail.media} />

                  <h3 className="forum-section-title mt-8">
                    {t("forum.replies").replace("{count}", String(detail.replies.length))}
                  </h3>
                  <ul className="forum-reply-list mt-4">
                    {detail.replies.map((r) => (
                      <li key={r.id} className="forum-reply-item">
                        <UserAvatar username={r.author.username} avatarUrl={r.author.avatarUrl} size={32} />
                        <div>
                          <p className="forum-meta">
                            {r.author.username} · {formatTime(r.createdAt, locale)}
                          </p>
                          <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">{r.body}</p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <form className="forum-form mt-6" onSubmit={onReply}>
                    <label className="auth-field">
                      <span>{t("forum.reply")}</span>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        required
                        maxLength={5000}
                        rows={3}
                        placeholder={user ? t("forum.replyPlaceholder") : t("forum.loginToReply")}
                        onFocus={() => {
                          if (!user) requireAuth();
                        }}
                      />
                    </label>
                    {formError && <p className="auth-error">{formError}</p>}
                    <GlassButton type="submit" disabled={busy}>
                      {t("forum.sendReply")}
                    </GlassButton>
                  </form>
                </>
              )}
            </GlassPanel>
          ) : loading ? (
            <GlassPanel className="p-10 text-center">
              <p className="text-[var(--text-secondary)]">…</p>
            </GlassPanel>
          ) : error ? (
            <GlassPanel className="p-10 text-center">
              <p className="text-[var(--text-secondary)]">{error}</p>
            </GlassPanel>
          ) : posts.length === 0 ? (
            <GlassPanel className="p-12 text-center">
              <p className="text-lg font-semibold text-[var(--text-primary)]">{t("forum.empty")}</p>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">{t("forum.emptyHint")}</p>
            </GlassPanel>
          ) : (
            <ul className="forum-post-list">
              {posts.map((post) => (
                <li key={post.id}>
                  <button type="button" className="forum-post-card" onClick={() => setSelectedId(post.id)}>
                    <div className="forum-post-header">
                      <UserAvatar
                        username={post.author.username}
                        avatarUrl={post.author.avatarUrl}
                        size={40}
                      />
                      <div className="min-w-0 flex-1 text-left">
                        <h3 className="forum-post-title truncate">{post.title}</h3>
                        <p className="forum-meta">
                          {post.author.username} · {formatTime(post.createdAt, locale)} ·{" "}
                          {t("forum.replyCount").replace("{count}", String(post.replyCount))}
                        </p>
                        <p className="mt-2 line-clamp-2 text-sm text-[var(--text-secondary)]">{post.body}</p>
                      </div>
                    </div>
                    {post.media.length > 0 && (
                      <p className="mt-2 text-left text-xs text-[var(--text-muted)]">
                        {t("forum.mediaCount").replace("{count}", String(post.media.length))}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
