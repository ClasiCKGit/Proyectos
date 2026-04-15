// src/api/auth.ts
// Cliente HTTP para los endpoints de autenticación.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

// ─── STORAGE ──────────────────────────────────────────────────────────────────

const KEYS = { ACCESS: "access_token", REFRESH: "refresh_token" } as const;

export const tokenStorage = {
  getAccess: () => localStorage.getItem(KEYS.ACCESS),
  getRefresh: () => localStorage.getItem(KEYS.REFRESH),
  set: (access: string, refresh: string) => {
    localStorage.setItem(KEYS.ACCESS, access);
    localStorage.setItem(KEYS.REFRESH, refresh);
  },
  clear: () => {
    localStorage.removeItem(KEYS.ACCESS);
    localStorage.removeItem(KEYS.REFRESH);
  },
};

// ─── HTTP ─────────────────────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data?.message ?? "Error"), { status: res.status, data });
  return data as T;
}

// ─── AUTH ENDPOINTS ───────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    post<AuthResponse>("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    post<AuthResponse>("/auth/login", data),

  refresh: (refreshToken: string) =>
    post<AuthResponse>("/auth/refresh", { refreshToken }),

  logout: async (accessToken: string, refreshToken: string) => {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });
  },
};
