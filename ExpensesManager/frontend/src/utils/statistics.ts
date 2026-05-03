import type {
  Transaction,
  Category,
  MonthlyStats,
  BudgetAlert,
  Budget,
} from "../types";

// ─── BALANCE ──────────────────────────────────────────────────────────────────

export function calculateBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => {
    return t.type === "income" ? acc + t.amount : acc - t.amount;
  }, 0);
}

export function calculateTotalIncome(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);
}

export function calculateTotalExpenses(transactions: Transaction[]): number {
  return transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);
}

// ─── BY CATEGORY ──────────────────────────────────────────────────────────────

export function groupByCategory(
  transactions: Transaction[]
): Record<Category, number> {
  const categories: Category[] = [
    "housing", "food", "transport", "health",
    "entertainment", "education", "clothing", "savings", "other",
  ];

  const result = Object.fromEntries(
    categories.map((c) => [c, 0])
  ) as Record<Category, number>;

  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      result[t.category] += t.amount;
    });

  return result;
}

export function getTopCategories(
  transactions: Transaction[],
  limit = 5
): Array<{ category: Category; amount: number; percentage: number }> {
  const grouped = groupByCategory(transactions);
  const total = calculateTotalExpenses(transactions);

  return Object.entries(grouped)
    .map(([category, amount]) => ({
      category: category as Category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

// ─── MONTHLY STATS ────────────────────────────────────────────────────────────

export function getMonthlyStats(
  transactions: Transaction[],
  year: number,
  month: number // 1-12
): MonthlyStats {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthTx = transactions.filter((t) => t.date.startsWith(prefix));

  return {
    month,
    year,
    totalIncome: calculateTotalIncome(monthTx),
    totalExpenses: calculateTotalExpenses(monthTx),
    balance: calculateBalance(monthTx),
    byCategory: groupByCategory(monthTx),
    transactionCount: monthTx.length,
  };
}

export function getLast12MonthsStats(
  transactions: Transaction[]
): MonthlyStats[] {
  const stats: MonthlyStats[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    stats.push(getMonthlyStats(transactions, date.getFullYear(), date.getMonth() + 1));
  }

  return stats;
}

// ─── TRENDS ───────────────────────────────────────────────────────────────────

export function getMonthOverMonthChange(
  transactions: Transaction[]
): { income: number; expenses: number; balance: number } {
  const now = new Date();
  const thisMonth = getMonthlyStats(transactions, now.getFullYear(), now.getMonth() + 1);

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonth = getMonthlyStats(transactions, prevDate.getFullYear(), prevDate.getMonth() + 1);

  const pct = (curr: number, prev: number): number => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    income: pct(thisMonth.totalIncome, prevMonth.totalIncome),
    expenses: pct(thisMonth.totalExpenses, prevMonth.totalExpenses),
    balance: pct(thisMonth.balance, prevMonth.balance),
  };
}

export function getAverageDailyExpense(
  transactions: Transaction[],
  year: number,
  month: number
): number {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthTx = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(prefix)
  );

  const daysInMonth = new Date(year, month, 0).getDate();
  return calculateTotalExpenses(monthTx) / daysInMonth;
}

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export function checkBudgetAlerts(
  transactions: Transaction[],
  budgets: Budget[],
  year: number,
  month: number
): BudgetAlert[] {
  const prefix = `${year}-${String(month).padStart(2, "0")}`;
  const monthTx = transactions.filter(
    (t) => t.type === "expense" && t.date.startsWith(prefix)
  );
  const byCategory = groupByCategory(monthTx);

  return budgets
    .filter((b) => b.period === "monthly")
    .map((budget) => {
      const spent = byCategory[budget.category] ?? 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        category: budget.category,
        limit: budget.limit,
        spent,
        percentage,
        isExceeded: spent > budget.limit,
      };
    })
    .filter((alert) => alert.percentage >= 80) // only warn at 80%+
    .sort((a, b) => b.percentage - a.percentage);
}

// ─── SAVINGS RATE ─────────────────────────────────────────────────────────────

export function calculateSavingsRate(
  transactions: Transaction[],
  year: number,
  month: number
): number {
  const stats = getMonthlyStats(transactions, year, month);
  if (stats.totalIncome === 0) return 0;
  return ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100;
}

// ─── PROJECTIONS ──────────────────────────────────────────────────────────────

export function projectEndOfMonthBalance(
  transactions: Transaction[],
  year: number,
  month: number
): number {
  const today = new Date();
  const daysInMonth = new Date(year, month, 0).getDate();
  const isCurrentMonth =
    today.getFullYear() === year &&
    today.getMonth() + 1 === month;

  const currentDay = isCurrentMonth ? today.getDate() : new Date(year, month, 0).getDate();

  const stats = getMonthlyStats(transactions, year, month);
  const dailyRate = currentDay > 0 ? stats.balance / currentDay : 0;

  return stats.balance + dailyRate * (daysInMonth - currentDay);
}
