// src/services/stats.service.ts
import { prisma } from "../lib/prisma";
import type { Category } from "@prisma/client";

const ALL_CATEGORIES: Category[] = [
  "housing", "food", "transport", "health",
  "entertainment", "education", "clothing", "savings", "other",
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function monthRange(year: number, month: number) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 0, 23, 59, 59); // last day of month
  return { from, to };
}

async function aggregateMonth(userId:string, year: number, month: number, ) {
  const { from, to } = monthRange(year, month);

  const rows = await prisma.transaction.groupBy({
    by: ["type", "category"],
    where: { date: { gte: from, lte: to }, userId: userId },
    _sum: { amount: true },
    _count: true,
  });

  let totalIncome = 0;
  let totalExpenses = 0;
  let transactionCount = 0;
  const byCategory: Record<string, number> = {};
  ALL_CATEGORIES.forEach((c) => (byCategory[c] = 0));

  rows.forEach((r) => {
    const val = Number(r._sum.amount ?? 0);
    transactionCount += r._count;
    if (r.type === "income") {
      totalIncome += val;
    } else {
      const category = r.category ?? "other";
      totalExpenses += val;
      byCategory[category] = (byCategory[category] ?? 0) + val;
    }
  });

  return { year, month, totalIncome, totalExpenses, balance: totalIncome - totalExpenses, byCategory, transactionCount };
}

// ─── EXPORTS ──────────────────────────────────────────────────────────────────

export async function getMonthlyStats(userId:string, year: number, month: number) {
  return aggregateMonth(userId, year, month);
}

export async function getLast12MonthsStats(userId:string) {
  const now = new Date();
  const promises = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return aggregateMonth(userId,d.getFullYear(), d.getMonth() + 1);
  });
  return Promise.all(promises);
}

export async function getTopCategories(userId:string, year: number, month: number, limit = 5) {
  const stats = await aggregateMonth(userId, year, month);
  const total = stats.totalExpenses || 1;

  return Object.entries(stats.byCategory)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: (amount / total) * 100,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, limit);
}

export async function checkBudgetAlerts(userId:string, year: number, month: number) {
  const [stats, budgets] = await Promise.all([
    aggregateMonth(userId, year, month),
    prisma.budget.findMany({ where: { period: "monthly" } }),
  ]);

  return budgets
    .map((b) => {
      const spent = stats.byCategory[b.category] ?? 0;
      const limit = Number(b.limit);
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;
      return {
        category: b.category,
        limit,
        spent,
        percentage,
        isExceeded: spent > limit,
      };
    })
    .filter((a) => a.percentage >= 80)
    .sort((a, b) => b.percentage - a.percentage);
}

export async function getMonthOverMonthChange(userId:string) {
  const now = new Date();
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [curr, last] = await Promise.all([
    aggregateMonth(userId, now.getFullYear(), now.getMonth() + 1),
    aggregateMonth(userId, prev.getFullYear(), prev.getMonth() + 1),
  ]);

  const pct = (c: number, p: number) =>
    p === 0 ? (c > 0 ? 100 : 0) : ((c - p) / p) * 100;

  return {
    income: pct(curr.totalIncome, last.totalIncome),
    expenses: pct(curr.totalExpenses, last.totalExpenses),
    balance: pct(curr.balance, last.balance),
  };
}

export async function getSavingsRate(userId:string, year: number, month: number) {
  const stats = await aggregateMonth(userId, year, month);
  if (stats.totalIncome === 0) return 0;
  return ((stats.totalIncome - stats.totalExpenses) / stats.totalIncome) * 100;
}

export async function getFullDashboard(userId:string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [currentMonth, last12Months, topCategories, budgetAlerts, monthOverMonth, savingsRate] =
    await Promise.all([
      getMonthlyStats(userId, year, month),
      getLast12MonthsStats(userId, ),
      getTopCategories(userId, year, month),
      checkBudgetAlerts(userId, year, month),
      getMonthOverMonthChange(userId, ),
      getSavingsRate(userId, year, month),
    ]);

  return { currentMonth, last12Months, topCategories, budgetAlerts, monthOverMonth, savingsRate };
}
