"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { uploadMedia, type Gender } from "@/lib/community-api";
import { cn } from "@/lib/utils";

function UserAvatar({
  username,
  avatarUrl,
  size = 40,
}: {
  username: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initial = username.slice(0, 1).toUpperCase();
  return (
    <div
      className="auth-avatar"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="auth-avatar-img" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}

export function AuthModal() {
  const { t } = useLocale();
  const { modal, closeModal, login, register, saveProfile, user, openLogin, openRegister, logout } =
    useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [signature, setSignature] = useState("");
  const [gender, setGender] = useState<Gender>("unset");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!modal) return;
    setError("");
    setBusy(false);
    if (modal === "login" || modal === "register") {
      setUsername("");
      setPassword("");
    }
    if (modal === "profile" && user) {
      setSignature(user.signature || "");
      setGender(user.gender || "unset");
      setAvatarUrl(user.avatarUrl);
    }
  }, [modal, user]);

  if (!modal) return null;

  async function onSubmitAuth(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (modal === "register") await register(username.trim(), password);
      else await login(username.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveProfile({ signature, gender, avatarUrl });
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onAvatarChange(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const res = await uploadMedia(file);
      setAvatarUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.uploadError"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="auth-modal-backdrop" role="presentation" onClick={closeModal}>
      <div className="auth-modal-panel-wrap" onClick={(e) => e.stopPropagation()}>
        <GlassPanel className="auth-modal-panel">
        <button type="button" className="auth-modal-close" onClick={closeModal} aria-label={t("common.close")}>
          ×
        </button>

        {modal === "profile" && user ? (
          <form className="auth-form" onSubmit={onSaveProfile}>
            <h2 className="auth-modal-title">{t("auth.profileTitle")}</h2>
            <div className="auth-profile-avatar-row">
              <UserAvatar username={user.username} avatarUrl={avatarUrl} size={64} />
              <div>
                <p className="auth-username">{user.username}</p>
                <label className="auth-file-label">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    hidden
                    disabled={uploading || busy}
                    onChange={(e) => onAvatarChange(e.target.files?.[0] || null)}
                  />
                  {uploading ? t("auth.uploading") : t("auth.changeAvatar")}
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    className="auth-text-btn"
                    onClick={() => setAvatarUrl(null)}
                  >
                    {t("auth.removeAvatar")}
                  </button>
                )}
              </div>
            </div>

            <label className="auth-field">
              <span>{t("auth.signature")}</span>
              <input
                value={signature}
                maxLength={120}
                onChange={(e) => setSignature(e.target.value)}
                placeholder={t("auth.signaturePlaceholder")}
              />
            </label>

            <label className="auth-field">
              <span>{t("auth.gender")}</span>
              <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
                <option value="unset">{t("auth.genderUnset")}</option>
                <option value="female">{t("auth.genderFemale")}</option>
                <option value="male">{t("auth.genderMale")}</option>
                <option value="other">{t("auth.genderOther")}</option>
              </select>
            </label>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-actions">
              <GlassButton type="submit" disabled={busy}>
                {busy ? t("auth.saving") : t("auth.save")}
              </GlassButton>
              <GlassButton type="button" variant="ghost" onClick={logout}>
                {t("auth.logout")}
              </GlassButton>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={onSubmitAuth}>
            <h2 className="auth-modal-title">
              {modal === "register" ? t("auth.registerTitle") : t("auth.loginTitle")}
            </h2>
            <p className="auth-modal-desc">
              {modal === "register" ? t("auth.registerHint") : t("auth.loginHint")}
            </p>

            <label className="auth-field">
              <span>{t("auth.username")}</span>
              <input
                value={username}
                autoComplete="username"
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                maxLength={24}
              />
            </label>

            <label className="auth-field">
              <span>{t("auth.password")}</span>
              <input
                type="password"
                value={password}
                autoComplete={modal === "register" ? "new-password" : "current-password"}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                maxLength={72}
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <div className="auth-actions">
              <GlassButton type="submit" disabled={busy}>
                {busy
                  ? t("auth.working")
                  : modal === "register"
                    ? t("auth.register")
                    : t("auth.login")}
              </GlassButton>
            </div>

            <p className="auth-switch">
              {modal === "register" ? (
                <>
                  {t("auth.haveAccount")}{" "}
                  <button type="button" className="auth-text-btn" onClick={openLogin}>
                    {t("auth.login")}
                  </button>
                </>
              ) : (
                <>
                  {t("auth.noAccount")}{" "}
                  <button type="button" className="auth-text-btn" onClick={openRegister}>
                    {t("auth.register")}
                  </button>
                </>
              )}
            </p>
          </form>
        )}
      </GlassPanel>
      </div>
    </div>
  );
}

export function AuthNavButton({ className }: { className?: string }) {
  const { t } = useLocale();
  const { enabled, user, openLogin, openProfile } = useAuth();
  if (!enabled) return null;

  if (user) {
    return (
      <button
        type="button"
        className={cn("auth-nav-btn", className)}
        onClick={openProfile}
        title={user.username}
      >
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size={28} />
        <span className="auth-nav-name">{user.username}</span>
      </button>
    );
  }

  return (
    <button type="button" className={cn("auth-nav-btn auth-nav-btn--login", className)} onClick={openLogin}>
      {t("auth.login")}
    </button>
  );
}

export { UserAvatar };
