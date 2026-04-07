import type { Transaction, Budget, SavingsGoal } from "../types";

const KEYS = {
  TRANSACTIONS: "expense_manager_transactions",
  BUDGETS: "expense_manager_budgets",
  SAVINGS_GOALS: "expense_manager_savings_goals",
} as const;

// ─── GENERIC HELPERS ──────────────────────────────────────────────────────────

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    console.error(`[storage] Failed to load "${key}"`, );
    return fallback;
  }
}

function save<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`[storage] Failed to save "${key}"`, err);
    return false;
  }
}

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export function loadTransactions(): Transaction[] {
  return load<Transaction[]>(KEYS.TRANSACTIONS, []);
}

export function saveTransactions(transactions: Transaction[]): boolean {
  return save(KEYS.TRANSACTIONS, transactions);
}

export function addTransactionToStorage(transaction: Transaction): Transaction[] {
  const current = loadTransactions();
  const updated = [transaction, ...current];
  saveTransactions(updated);
  return updated;
}

export function updateTransactionInStorage(
  updated: Transaction
): Transaction[] {
  const current = loadTransactions();
  const next = current.map((t) => (t.id === updated.id ? updated : t));
  saveTransactions(next);
  return next;
}

export function deleteTransactionFromStorage(id: string): Transaction[] {
  const current = loadTransactions();
  const next = current.filter((t) => t.id !== id);
  saveTransactions(next);
  return next;
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export function loadBudgets(): Budget[] {
  return load<Budget[]>(KEYS.BUDGETS, []);
}

export function saveBudgets(budgets: Budget[]): boolean {
  return save(KEYS.BUDGETS, budgets);
}

export function upsertBudget(budget: Budget): Budget[] {
  const current = loadBudgets();
  const exists = current.findIndex((b) => b.id === budget.id);
  const next =
    exists >= 0
      ? current.map((b) => (b.id === budget.id ? budget : b))
      : [...current, budget];
  saveBudgets(next);
  return next;
}

export function deleteBudget(id: string): Budget[] {
  const current = loadBudgets();
  const next = current.filter((b) => b.id !== id);
  saveBudgets(next);
  return next;
}

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

export function loadSavingsGoals(): SavingsGoal[] {
  return load<SavingsGoal[]>(KEYS.SAVINGS_GOALS, []);
}

export function saveSavingsGoals(goals: SavingsGoal[]): boolean {
  return save(KEYS.SAVINGS_GOALS, goals);
}

export function upsertSavingsGoal(goal: SavingsGoal): SavingsGoal[] {
  const current = loadSavingsGoals();
  const exists = current.findIndex((g) => g.id === goal.id);
  const next =
    exists >= 0
      ? current.map((g) => (g.id === goal.id ? goal : g))
      : [...current, goal];
  saveSavingsGoals(next);
  return next;
}

export function deleteSavingsGoal(id: string): SavingsGoal[] {
  const current = loadSavingsGoals();
  const next = current.filter((g) => g.id !== id);
  saveSavingsGoals(next);
  return next;
}

// ─── IMPORT / EXPORT ──────────────────────────────────────────────────────────

export interface ExportData {
  version: number;
  exportedAt: string;
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
}

export function exportData(): ExportData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: loadTransactions(),
    budgets: loadBudgets(),
    savingsGoals: loadSavingsGoals(),
  };
}

export function importData(data: ExportData): void {
  if (data.version !== 1) {
    throw new Error(`Unsupported data version: ${data.version}`);
  }
  saveTransactions(data.transactions ?? []);
  saveBudgets(data.budgets ?? []);
  saveSavingsGoals(data.savingsGoals ?? []);
}

export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
}
