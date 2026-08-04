"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { UserAvatar } from "@/components/auth/AuthModal";
import { GlassButton } from "@/components/ui/GlassButton";
import { useLocale } from "@/components/i18n/LocaleProvider";
import {
  createCharacterWallComment,
  deleteCharacterWallComment,
  isCommunityEnabled,
  listCharacterWall,
  type WallComment,
} from "@/lib/community-api";

function formatTime(ts: number, locale: string) {
  try {
    return new Date(ts).toLocaleString(locale === "ja" ? "ja-JP" : locale === "en" ? "en-US" : "zh-CN");
  } catch {
    return new Date(ts).toLocaleString();
  }
}

export function CharacterConfessionWall({
  characterId,
  accent = "#e9435e",
}: {
  characterId: number;
  accent?: string;
}) {
  const { t, locale } = useLocale();
  const { enabled, user, requireAuth } = useAuth();
  const [comments, setComments] = useState<WallComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!isCommunityEnabled()) return;
    setLoading(true);
    setError("");
    try {
      const res = await listCharacterWall(characterId);
      setComments(res.comments);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("wall.loadError"));
    } finally {
      setLoading(false);
    }
  }, [characterId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!enabled) {
    return (
      <div className="character-wall">
        <h3 className="character-wall-title" style={{ color: accent }}>
          {t("wall.title")}
        </h3>
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
      await createCharacterWallComment(characterId, body.trim());
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("wall.postError"));
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!requireAuth()) return;
    setBusy(true);
    try {
      await deleteCharacterWallComment(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("wall.deleteError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="character-wall">
      <h3 className="character-wall-title" style={{ color: accent }}>
        {t("wall.title")}
        <span className="card-comments-count">{comments.length}</span>
      </h3>
      <p className="character-wall-hint">{t("wall.subtitle")}</p>

      <form className="card-comments-form" onSubmit={onSubmit}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          required
          placeholder={user ? t("wall.placeholder") : t("wall.loginHint")}
          onFocus={() => {
            if (!user) requireAuth();
          }}
        />
        <GlassButton type="submit" disabled={busy || !body.trim()}>
          {t("wall.submit")}
        </GlassButton>
      </form>

      {error && <p className="auth-error mt-2">{error}</p>}

      {loading ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">…</p>
      ) : comments.length === 0 ? (
        <p className="mt-4 text-sm text-[var(--text-muted)]">{t("wall.empty")}</p>
      ) : (
        <ul className="character-wall-list">
          {comments.map((c) => (
            <li key={c.id} className="card-comment-item">
              <UserAvatar username={c.author.username} avatarUrl={c.author.avatarUrl} size={36} />
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
                  {t("wall.delete")}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
