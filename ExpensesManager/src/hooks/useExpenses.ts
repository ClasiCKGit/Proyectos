import { useState, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import type {
  Transaction,
  Budget,
  SavingsGoal,
  FilterOptions,
  SortOptions,
  PaginationOptions,
  PaginatedResult,
} from "../types";
import {
  createTransaction,
  updateTransaction,
  filterTransactions,
  sortTransactions,
  paginateTransactions,
} from "../utils/transactions";
import {
  calculateBalance,
  calculateTotalIncome,
  calculateTotalExpenses,
  getMonthlyStats,
  getLast12MonthsStats,
  getTopCategories,
  checkBudgetAlerts,
  getMonthOverMonthChange,
  calculateSavingsRate,
  projectEndOfMonthBalance,
} from "../utils/statistics";
import {
  loadTransactions,
  saveTransactions,
  loadBudgets,
  saveBudgets,
  loadSavingsGoals,
  saveSavingsGoals,
  exportData,
  importData,
  clearAllData,
  type ExportData,
} from "../utils/storage";

export function useExpenses() {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadTransactions()
  );
  const [budgets, setBudgets] = useState<Budget[]>(() => loadBudgets());
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>(() =>
    loadSavingsGoals()
  );

  // ─── TRANSACTION ACTIONS ────────────────────────────────────────────────────

  const addTransaction = useCallback(
    (params: Omit<Transaction, "id" | "createdAt" | "updatedAt">) => {
      const tx = createTransaction(params);
      setTransactions((prev) => {
        const next = [tx, ...prev];
        saveTransactions(next);
        return next;
      });
      return tx;
    },
    []
  );

  const editTransaction = useCallback(
    (
      id: string,
      updates: Partial<Omit<Transaction, "id" | "createdAt">>
    ) => {
      setTransactions((prev) => {
        const target = prev.find((t) => t.id === id);
        if (!target) return prev;
        const updated = updateTransaction(target, updates);
        const next = prev.map((t) => (t.id === id ? updated : t));
        saveTransactions(next);
        return next;
      });
    },
    []
  );

  const removeTransaction = useCallback((id: string) => {
    setTransactions((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveTransactions(next);
      return next;
    });
  }, []);

  const removeMultipleTransactions = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTransactions((prev) => {
      const next = prev.filter((t) => !idSet.has(t.id));
      saveTransactions(next);
      return next;
    });
  }, []);

  // ─── QUERY ─────────────────────────────────────────────────────────────────

  const queryTransactions = useCallback(
    (
      filters: FilterOptions = {},
      sort: SortOptions = { field: "date", direction: "desc" },
      pagination?: PaginationOptions
    ): PaginatedResult<Transaction> => {
      const filtered = filterTransactions(transactions, filters);
      const sorted = sortTransactions(filtered, sort);

      const page = pagination ?? { page: 1, pageSize: sorted.length || 1 };
      return paginateTransactions(sorted, page);
    },
    [transactions]
  );

  // ─── BUDGET ACTIONS ─────────────────────────────────────────────────────────

  const upsertBudget = useCallback((budget: Omit<Budget, "id" | "createdAt"> & { id?: string }) => {
    const now = new Date().toISOString();
    const full: Budget = {
      ...budget,
      id: budget.id ?? uuidv4(),
      createdAt: now,
    };
    setBudgets((prev) => {
      const exists = prev.findIndex((b) => b.id === full.id);
      const next =
        exists >= 0
          ? prev.map((b) => (b.id === full.id ? full : b))
          : [...prev, full];
      saveBudgets(next);
      return next;
    });
    return full;
  }, []);

  const removeBudget = useCallback((id: string) => {
    setBudgets((prev) => {
      const next = prev.filter((b) => b.id !== id);
      saveBudgets(next);
      return next;
    });
  }, []);

  // ─── SAVINGS GOAL ACTIONS ───────────────────────────────────────────────────

  const upsertSavingsGoal = useCallback(
    (goal: Omit<SavingsGoal, "id" | "createdAt"> & { id?: string }) => {
      const now = new Date().toISOString();
      const full: SavingsGoal = {
        ...goal,
        id: goal.id ?? uuidv4(),
        createdAt: now,
      };
      setSavingsGoals((prev) => {
        const exists = prev.findIndex((g) => g.id === full.id);
        const next =
          exists >= 0
            ? prev.map((g) => (g.id === full.id ? full : g))
            : [...prev, full];
        saveSavingsGoals(next);
        return next;
      });
      return full;
    },
    []
  );

  const removeSavingsGoal = useCallback((id: string) => {
    setSavingsGoals((prev) => {
      const next = prev.filter((g) => g.id !== id);
      saveSavingsGoals(next);
      return next;
    });
  }, []);

  const contributeSavingsGoal = useCallback((id: string, amount: number) => {
    setSavingsGoals((prev) => {
      const next = prev.map((g) =>
        g.id === id
          ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
          : g
      );
      saveSavingsGoals(next);
      return next;
    });
  }, []);

  // ─── STATS (memoized) ───────────────────────────────────────────────────────

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const stats = useMemo(() => ({
    balance: calculateBalance(transactions),
    totalIncome: calculateTotalIncome(transactions),
    totalExpenses: calculateTotalExpenses(transactions),
    currentMonth: getMonthlyStats(transactions, currentYear, currentMonth),
    last12Months: getLast12MonthsStats(transactions),
    topCategories: getTopCategories(transactions),
    budgetAlerts: checkBudgetAlerts(transactions, budgets, currentYear, currentMonth),
    monthOverMonth: getMonthOverMonthChange(transactions),
    savingsRate: calculateSavingsRate(transactions, currentYear, currentMonth),
    projectedBalance: projectEndOfMonthBalance(transactions, currentYear, currentMonth),
  }), [transactions, budgets, currentYear, currentMonth]);

  // ─── IMPORT / EXPORT ────────────────────────────────────────────────────────

  const handleExport = useCallback(() => exportData(), []);

  const handleImport = useCallback((data: ExportData) => {
    importData(data);
    setTransactions(loadTransactions());
    setBudgets(loadBudgets());
    setSavingsGoals(loadSavingsGoals());
  }, []);

  const resetAll = useCallback(() => {
    clearAllData();
    setTransactions([]);
    setBudgets([]);
    setSavingsGoals([]);
  }, []);

  return {
    // State
    transactions,
    budgets,
    savingsGoals,
    stats,

    // Transaction actions
    addTransaction,
    editTransaction,
    removeTransaction,
    removeMultipleTransactions,
    queryTransactions,

    // Budget actions
    upsertBudget,
    removeBudget,

    // Savings goal actions
    upsertSavingsGoal,
    removeSavingsGoal,
    contributeSavingsGoal,

    // Data management
    handleExport,
    handleImport,
    resetAll,
  };
}
