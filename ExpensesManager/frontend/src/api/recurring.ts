// src/api/recurring.ts
import { request } from "./client";

export interface RecurringTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  category: string;
  notes?: string | null;
  recurrence: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  lastRunAt: string | null;
  isActive: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface UpcomingOccurrence {
  recurringId: string;
  description: string;
  date: string;
  amount: number;
  type: "income" | "expense";
  category: string;
}

export interface ProyectedMonthly {
  monthlyExp: number;
  monthlyInc: number;
}

export const recurringApi = {
  list: () =>
    request<RecurringTransaction[]>("/recurring"),

  upcoming: (days = 30) =>
    request<UpcomingOccurrence[]>(`/recurring/upcoming?days=${days}`),

  get: (id: string) =>
    request<RecurringTransaction>(`/recurring/${id}`),

  create: (body: Omit<RecurringTransaction, "id" | "nextDueDate" | "lastRunAt" | "isActive" | "createdAt" | "updatedAt">) =>
    request<RecurringTransaction>("/recurring", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  update: (id: string, body: Partial<RecurringTransaction>) =>
    request<RecurringTransaction>(`/recurring/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  toggle: (id: string) =>
    request<RecurringTransaction>(`/recurring/${id}/toggle`, { method: "PATCH" }),

  remove: (id: string) =>
    request<void>(`/recurring/${id}`, { method: "DELETE" }),

  process: () =>
    request<{ processed: number; generated: any[]; deactivated: number }>(
      "/recurring/process",
      { method: "POST" }
    ),

  monthly: () => 
    request<ProyectedMonthly>(
      "/recurring/monthlystats",
      { method: "GET"}
    )
};
