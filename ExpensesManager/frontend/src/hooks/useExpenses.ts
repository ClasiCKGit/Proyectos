// src/hooks/useExpenses.ts  (versión API)
// Reemplaza la versión anterior basada en localStorage.

import { useState, useEffect, useCallback } from "react";
import { transactionsApi, budgetsApi, savingsGoalsApi, statsApi } from "./../api/client";
import type { Transaction, Budget, SavingsGoal } from "../types";

type Stats = {
  currentMonth: any;
  last12Months: any[];
  topCategories: any[];
  budgetAlerts: any[];
  monthOverMonth: any;
  savingsRate: number;
};

const EMPTY_STATS: Stats = {
  currentMonth: { totalIncome: 0, totalExpenses: 0, balance: 0, byCategory: {}, transactionCount: 0 },
  last12Months: [],
  topCategories: [],
  budgetAlerts: [],
  monthOverMonth: { income: 0, expenses: 0, balance: 0 },
  savingsRate: 0,
};

export function useExpenses() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [stats, setStats] = useState<Stats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ─── INITIAL LOAD ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [txResult, budgetList, goalList, dashStats] = await Promise.all([
        transactionsApi.list({ pageSize: 100, sortField: "date", sortDir: "desc" }),
        budgetsApi.list(),
        savingsGoalsApi.list(),
        statsApi.dashboard(),
      ]);
      setTransactions(txResult.data ?? []);
      setBudgets(budgetList);
      setSavingsGoals(goalList);
      setStats(dashStats);
    } catch (e: any) {
      setError(e.message ?? "Error al cargar datos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const refreshStats = useCallback(async () => {
    try {
      const s = await statsApi.dashboard();
      setStats(s);
    } catch { /* silently fail */ }
  }, []);

  // ─── TRANSACTIONS ──────────────────────────────────────────────────────────

  const addTransaction = useCallback(
    async (data: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const tx = await transactionsApi.create(data);
      setTransactions((prev) => [tx, ...prev]);
      await refreshStats();
      return tx;
    }, [refreshStats]
  );

  const editTransaction = useCallback(
    async (id: string, updates: Partial<Omit<Transaction, "id" | "createdAt">>) => {
      const tx = await transactionsApi.update(id, updates);
      setTransactions((prev) => prev.map((t) => (t.id === id ? tx : t)));
      await refreshStats();
      return tx;
    }, [refreshStats]
  );

  const removeTransaction = useCallback(async (id: string) => {
    await transactionsApi.remove(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await refreshStats();
  }, [refreshStats]);

  const queryTransactions = useCallback(
    (params: Record<string, unknown>) => transactionsApi.list(params),
    []
  );

  // ─── BUDGETS ───────────────────────────────────────────────────────────────

  const upsertBudget = useCallback(async (data: Omit<Budget, "id" | "createdAt">) => {
    const b = await budgetsApi.upsert(data);
    setBudgets((prev) => {
      const idx = prev.findIndex((x) => x.id === b.id);
      return idx >= 0 ? prev.map((x) => (x.id === b.id ? b : x)) : [...prev, b];
    });
    await refreshStats();
    return b;
  }, [refreshStats]);

  const removeBudget = useCallback(async (id: string | undefined) => {
    await budgetsApi.remove(id);
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    await refreshStats();
  }, [refreshStats]);

  // ─── SAVINGS GOALS ─────────────────────────────────────────────────────────

  const upsertSavingsGoal = useCallback(
    async (data: Omit<SavingsGoal, "id" | "createdAt"> & { id?: string }) => {
      const goal = data.id
        ? await savingsGoalsApi.update(data.id, data)
        : await savingsGoalsApi.create(data);
      setSavingsGoals((prev) => {
        const idx = prev.findIndex((g) => g.id === goal.id);
        return idx >= 0 ? prev.map((g) => (g.id === goal.id ? goal : g)) : [...prev, goal];
      });
      return goal;
    }, []
  );

  const removeSavingsGoal = useCallback(async (id: string) => {
    await savingsGoalsApi.remove(id);
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const contributeSavingsGoal = useCallback(async (id: string, amount: number) => {
    const goal = await savingsGoalsApi.contribute(id, amount);
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? goal : g)));
    return goal;
  }, []);

  return {
    // State
    transactions,
    budgets,
    savingsGoals,
    stats,
    loading,
    error,

    // Actions
    addTransaction,
    editTransaction,
    removeTransaction,
    queryTransactions,
    upsertBudget,
    removeBudget,
    upsertSavingsGoal,
    removeSavingsGoal,
    contributeSavingsGoal,
    reload: loadAll,
  };
}
