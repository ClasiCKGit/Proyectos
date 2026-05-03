// Agrega el header Authorization en cada request y renueva el token automáticamente.
import { tokenStorage, authApi } from "./auth";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

function handleSessionExpired() {
    tokenStorage.clear();
    localStorage.clear();
    // redirigir
    window.location.href = "/login";
}

async function getValidAccessToken(): Promise<string | null> {
    const access = tokenStorage.getAccess();
    if (access) return access;

    const refresh = tokenStorage.getRefresh();
    if (!refresh) return null;

    // Only one refresh request at a time — queue the rest
    if (isRefreshing) {
        return new Promise((resolve) => {
            refreshQueue.push(resolve);
        });
    }

    isRefreshing = true;
    try {
        const res = await authApi.refresh(refresh);
        tokenStorage.set(res.accessToken, res.refreshToken);
        refreshQueue.forEach((cb) => cb(res.accessToken));
        refreshQueue = [];
        return res.accessToken;
    } catch {
        tokenStorage.clear();
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return null;
    } finally {
        isRefreshing = false;
    }
}

export async function request<T>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = await getValidAccessToken();

    const res = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
    });

    // Token expired mid-request → try refresh once
    if (res.status === 401) {
        const body = await res.json().catch(() => ({}));
        if (body?.code === "TOKEN_EXPIRED") {
            tokenStorage.clear(); // force re-fetch on next call
            const newToken = await getValidAccessToken();
            if (newToken) {
                const retry = await fetch(`${BASE_URL}${path}`, {
                    ...options,
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${newToken}`,
                        ...options.headers,
                    },
                });
                if (retry.status === 204) return undefined as T;
                const retryData = await retry.json();
                if (!retry.ok) {
                    if (retry.status === 401) {
                        handleSessionExpired();
                    }
                    throw Object.assign(
                        new Error(retryData?.message ?? "Error"),
                        { status: retry.status },
                    );
                }
                return retryData as T;
            }
        }
        handleSessionExpired();
        throw Object.assign(new Error(body?.message ?? "Sesion expirada"), {
            status: 401,
        });
    }

    if (res.status === 204) return undefined as T;
    const data = await res.json();
    if (!res.ok)
        throw Object.assign(new Error(data?.message ?? "Error"), {
            status: res.status,
            data,
        });
    return data as T;
}

// ─── ENDPOINTS ────────────────────────────────────────────────────────────────

export const transactionsApi = {
    list: (params?: Record<string, unknown>) => {
        const qs = params
            ? "?" + new URLSearchParams(params as any).toString()
            : "";
        return request<any>(`/transactions${qs}`);
    },
    get: (id: string) => request<any>(`/transactions/${id}`),
    create: (body: unknown) =>
        request<any>("/transactions", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (id: string, body: unknown) =>
        request<any>(`/transactions/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),
    remove: (id: string) =>
        request<void>(`/transactions/${id}`, { method: "DELETE" }),
};

export const budgetsApi = {
    list: () => request<any[]>("/budgets"),
    upsert: (body: unknown) =>
        request<any>("/budgets", { method: "PUT", body: JSON.stringify(body) }),
    remove: (id: string | undefined) =>
        request<void>(`/budgets/${id}`, { method: "DELETE" }),
};

export const savingsGoalsApi = {
    list: () => request<any[]>("/savings-goals"),
    create: (body: unknown) =>
        request<any>("/savings-goals", {
            method: "POST",
            body: JSON.stringify(body),
        }),
    update: (id: string, body: unknown) =>
        request<any>(`/savings-goals/${id}`, {
            method: "PATCH",
            body: JSON.stringify(body),
        }),
    contribute: (id: string, amount: number) =>
        request<any>(`/savings-goals/${id}/contribute`, {
            method: "POST",
            body: JSON.stringify({ amount }),
        }),
    remove: (id: string) =>
        request<void>(`/savings-goals/${id}`, { method: "DELETE" }),
};

export const statsApi = {
    dashboard: () => request<any>("/stats/dashboard"),
    monthly: (year: number, month: number) =>
        request<any>(`/stats/monthly?year=${year}&month=${month}`),
    last12Months: () => request<any[]>("/stats/last12months"),
};
