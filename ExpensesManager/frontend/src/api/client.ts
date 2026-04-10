// src/api/client.ts
// Reemplaza el storage.ts basado en localStorage.
// Cambiá BASE_URL si tu backend corre en otro puerto.

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  if (res.status === 204) return undefined as T;

  const data = await res.json();
  if (!res.ok) {
    const message = data?.message ?? "Error desconocido";
    throw Object.assign(new Error(message), { status: res.status, data });
  }
  return data as T;
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  list: (params?: Record<string, unknown>) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return request<any>(`/transactions${qs}`);
  },
  get: (id: string) => request<any>(`/transactions/${id}`),
  create: (body: unknown) =>
    request<any>("/transactions", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: unknown) =>
    request<any>(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<void>(`/transactions/${id}`, { method: "DELETE" }),
};

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export const budgetsApi = {
  list: () => request<any[]>("/budgets"),
  upsert: (body: unknown) =>
    request<any>("/budgets", { method: "PUT", body: JSON.stringify(body) }),
  remove: (id: string) =>
    request<void>(`/budgets/${id}`, { method: "DELETE" }),
};

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

export const savingsGoalsApi = {
  list: () => request<any[]>("/savings-goals"),
  create: (body: unknown) =>
    request<any>("/savings-goals", { method: "POST", body: JSON.stringify(body) }),
  update: (id: string, body: unknown) =>
    request<any>(`/savings-goals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  contribute: (id: string, amount: number) =>
    request<any>(`/savings-goals/${id}/contribute`, {
      method: "POST",
      body: JSON.stringify({ amount }),
    }),
  remove: (id: string) =>
    request<void>(`/savings-goals/${id}`, { method: "DELETE" }),
};

// ─── STATS ────────────────────────────────────────────────────────────────────

export const statsApi = {
  dashboard: () => request<any>("/stats/dashboard"),
  monthly: (year: number, month: number) =>
    request<any>(`/stats/monthly?year=${year}&month=${month}`),
  last12Months: () => request<any[]>("/stats/last12months"),
};
