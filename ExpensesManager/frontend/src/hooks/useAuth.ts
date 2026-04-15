// src/hooks/useAuth.ts
import { useState, useCallback, useEffect } from "react";
import { authApi, tokenStorage, type AuthUser } from "../api/auth";

interface AuthState {
  user: AuthUser | null;
  loading: boolean;   // initial check
  error: string | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  // ─── RESTORE SESSION ──────────────────────────────────────────────────────
  useEffect(() => {
    const restore = async () => {
      const refresh = tokenStorage.getRefresh();
      if (!refresh) { setState({ user: null, loading: false, error: null }); return; }

      try {
        const res = await authApi.refresh(refresh);
        tokenStorage.set(res.accessToken, res.refreshToken);
        setState({ user: res.user, loading: false, error: null });
      } catch {
        tokenStorage.clear();
        setState({ user: null, loading: false, error: null });
      }
    };
    restore();
  }, []);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      setState((s) => ({ ...s, error: null }));
      const res = await authApi.register(data);
      tokenStorage.set(res.accessToken, res.refreshToken);
      setState({ user: res.user, loading: false, error: null });
      return res.user;
    },
    []
  );

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, error: null }));
    const res = await authApi.login({ email, password });
    tokenStorage.set(res.accessToken, res.refreshToken);
    setState({ user: res.user, loading: false, error: null });
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    const access = tokenStorage.getAccess();
    const refresh = tokenStorage.getRefresh();
    if (access && refresh) {
      await authApi.logout(access, refresh).catch(() => {});
    }
    tokenStorage.clear();
    setState({ user: null, loading: false, error: null });
  }, []);

  return {
    user: state.user,
    isAuthenticated: !!state.user,
    loading: state.loading,
    error: state.error,
    register,
    login,
    logout,
  };
}
