"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  fetchMe,
  getStoredToken,
  isCommunityEnabled,
  login as apiLogin,
  register as apiRegister,
  setStoredToken,
  updateMe,
  type CommunityUser,
  type Gender,
} from "@/lib/community-api";

type AuthModalMode = "login" | "register" | "profile" | null;

type AuthContextValue = {
  enabled: boolean;
  ready: boolean;
  user: CommunityUser | null;
  token: string | null;
  modal: AuthModalMode;
  openLogin: () => void;
  openRegister: () => void;
  openProfile: () => void;
  closeModal: () => void;
  requireAuth: (then?: () => void) => boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  saveProfile: (patch: {
    avatarUrl?: string | null;
    signature?: string;
    gender?: Gender;
  }) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const enabled = isCommunityEnabled();
  const [ready, setReady] = useState(!enabled);
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [modal, setModal] = useState<AuthModalMode>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const stored = getStoredToken();
    if (!stored) {
      setReady(true);
      return;
    }
    fetchMe(stored)
      .then((res) => {
        if (cancelled) return;
        setToken(stored);
        setUser(res.user);
      })
      .catch(() => {
        if (cancelled) return;
        setStoredToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const closeModal = useCallback(() => {
    setModal(null);
    setPendingAction(null);
  }, []);

  const openLogin = useCallback(() => setModal("login"), []);
  const openRegister = useCallback(() => setModal("register"), []);
  const openProfile = useCallback(() => setModal("profile"), []);

  const requireAuth = useCallback(
    (then?: () => void) => {
      if (user) {
        then?.();
        return true;
      }
      if (then) setPendingAction(() => then);
      setModal("login");
      return false;
    },
    [user]
  );

  const login = useCallback(
    async (username: string, password: string) => {
      const res = await apiLogin(username, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setModal(null);
      const action = pendingAction;
      setPendingAction(null);
      action?.();
    },
    [pendingAction]
  );

  const register = useCallback(
    async (username: string, password: string) => {
      const res = await apiRegister(username, password);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setModal(null);
      const action = pendingAction;
      setPendingAction(null);
      action?.();
    },
    [pendingAction]
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setModal(null);
  }, []);

  const saveProfile = useCallback(async (patch: {
    avatarUrl?: string | null;
    signature?: string;
    gender?: Gender;
  }) => {
    const res = await updateMe(patch);
    setUser(res.user);
  }, []);

  const value = useMemo(
    () => ({
      enabled,
      ready,
      user,
      token,
      modal,
      openLogin,
      openRegister,
      openProfile,
      closeModal,
      requireAuth,
      login,
      register,
      logout,
      saveProfile,
    }),
    [
      enabled,
      ready,
      user,
      token,
      modal,
      openLogin,
      openRegister,
      openProfile,
      closeModal,
      requireAuth,
      login,
      register,
      logout,
      saveProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
