"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserAvatar } from "@/components/auth/AuthModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  createCardComment,
  deleteCardComment,
  isCommunityEnabled,
  listCardComments,
  type CardComment,
} from "@/lib/community-api";
import type { CardVariant } from "@/lib/cards";

function formatTime(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN");
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function CardCommentsPanel({
  cardId,
  variant,
}: {
  cardId: string;
  variant: CardVariant;
}) {
  const { t, locale } = useLocale();
  const { enabled, user, requireAuth } = useAuth();
  const [comments, setComments] = useState<CardComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isCommunityEnabled()) return;
    setLoading(true);
    setError("");
    try {
      const res = await listCardComments(cardId, variant);
      setComments(res.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("comments.loadError"));
    } finally {
      setLoading(false);
    }
  }, [cardId, variant, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) {
    return (
      <div className="card-comments">
        <h3 className="card-comments-title">{t("comments.title")}</h3>
        <p className="text-sm text-[var(--text-muted)]">{t("forum.disabled")}</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!requireAuth()) return;
    setBusy(true);
    setError("");
    try {
      await createCardComment(cardId, body.trim(), variant);
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("comments.postError"));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await deleteCardComment(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("comments.deleteError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card-comments">
      <h3 className="card-comments-title">
        {t("comments.title")}
        <span className="card-comments-count">{comments.length}</span>
      </h3>

      <form className="card-comments-form" onSubmit={onSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={2}
          required
          placeholder={user ? t("comments.placeholder") : t("comments.loginHint")}
          onFocus={() => {
            if (!user) requireAuth();
          }}
        />
        <GlassButton type="submit" disabled={busy || !body.trim()}>
          {t("comments.submit")}
        </GlassButton>
      </form>

      {error && <p className="auth-error mt-2">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{t("comments.empty")}</p>
      ) : (
        <ul className="card-comments-list">
          {comments.map((c) => (
            <li key={c.id} className="card-comment-item">
              <UserAvatar username={c.author.username} avatarUrl={c.author.avatarUrl} size={32} />
              <div className="min-w-0 flex-1">
                <p className="forum-meta">
                  {c.author.username} · {formatTime(c.createdAt, locale)}
                </p>
                <p className="whitespace-pre-wrap text-sm text-[var(--text-primary)]">{c.body}</p>
              </div>
              {user?.id === c.author.id && (
                <button
                  type="button"
                  className="auth-text-btn"
                  disabled={busy}
                  onClick={() => onDelete(c.id)}
                >
                  {t("comments.delete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
