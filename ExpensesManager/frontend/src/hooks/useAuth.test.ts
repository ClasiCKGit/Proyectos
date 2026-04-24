// src/__tests__/hooks/useAuth.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAuth } from "./useAuth";
import { authApi, tokenStorage } from "../api/auth";

vi.mock("../api/auth", () => ({
  authApi: {
    register: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    refresh: vi.fn(),
  },
  tokenStorage: {
    getAccess: vi.fn(),
    getRefresh: vi.fn(),
    set: vi.fn(),
    clear: vi.fn(),
  },
}));

const mockUser = {
  id: "user-1",
  email: "test@email.com",
  name: "Test User",
  createdAt: "2026-01-01T00:00:00.000Z",
};

const mockTokens = {
  user: mockUser,
  accessToken: "access.token",
  refreshToken: "refresh.token",
};

beforeEach(() => {
  vi.clearAllMocks();
  (tokenStorage.getRefresh as ReturnType<typeof vi.fn>).mockReturnValue(null);
  (tokenStorage.getAccess as ReturnType<typeof vi.fn>).mockReturnValue(null);
});

// ─── Initial load ─────────────────────────────────────────────────────────────

describe("useAuth — initial load", () => {
  it("comienza con usuario null y luego termina loading", async () => {
    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("restaura sesión si hay refresh token guardado", async () => {
    (tokenStorage.getRefresh as ReturnType<typeof vi.fn>).mockReturnValue("stored-refresh");
    (authApi.refresh as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user?.email).toBe("test@email.com");
    expect(result.current.isAuthenticated).toBe(true);
  });

  it("limpia el storage si el refresh falla", async () => {
    (tokenStorage.getRefresh as ReturnType<typeof vi.fn>).mockReturnValue("expired-token");
    (authApi.refresh as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("Expired"));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(tokenStorage.clear).toHaveBeenCalled();
  });
});

// ─── login ────────────────────────────────────────────────────────────────────

describe("useAuth — login", () => {
  it("setea el usuario y guarda los tokens", async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.login("test@email.com", "Password1");
    });

    expect(result.current.user?.email).toBe("test@email.com");
    expect(result.current.isAuthenticated).toBe(true);
    expect(tokenStorage.set).toHaveBeenCalledWith("access.token", "refresh.token");
  });

  it("propaga el error si las credenciales son incorrectas", async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error("Credenciales incorrectas"), { status: 401 })
    );

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await expect(
      act(async () => { await result.current.login("x@x.com", "WrongPass"); })
    ).rejects.toThrow("Credenciales incorrectas");

    expect(result.current.user).toBeNull();
  });
});

// ─── register ─────────────────────────────────────────────────────────────────

describe("useAuth — register", () => {
  it("crea cuenta y setea el usuario", async () => {
    (authApi.register as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.register({ name: "Test", email: "test@email.com", password: "Password1" });
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(tokenStorage.set).toHaveBeenCalled();
  });
});

// ─── logout ───────────────────────────────────────────────────────────────────

describe("useAuth — logout", () => {
  it("limpia el usuario y el storage", async () => {
    (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(mockTokens);
    (authApi.logout as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (tokenStorage.getAccess as ReturnType<typeof vi.fn>).mockReturnValue("access.token");
    (tokenStorage.getRefresh as ReturnType<typeof vi.fn>)
      .mockReturnValueOnce(null)       // initial load → no restore
      .mockReturnValue("refresh.token"); // after login

    const { result } = renderHook(() => useAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => { await result.current.login("test@email.com", "Password1"); });
    expect(result.current.isAuthenticated).toBe(true);

    await act(async () => { await result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(tokenStorage.clear).toHaveBeenCalled();
  });
});
