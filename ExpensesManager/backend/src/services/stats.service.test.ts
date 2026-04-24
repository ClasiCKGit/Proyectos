// src/__tests__/services/stats.service.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import * as statsService from "./stats.service";
import { prisma } from "../lib/prisma";

const db = prisma as jest.Mocked<typeof prisma>;
const groupByMock = db.transaction.groupBy as unknown as jest.Mock<any>;
const budgetFindManyMock = db.budget.findMany as unknown as jest.Mock<any>;

beforeEach(async () => jest.clearAllMocks());

// ─── MOCK groupBy response ────────────────────────────────────────────────────

const mockGroupBy = [
  { type: "income",  category: "other",         _sum: { amount: 180000 }, _count: 1 },
  { type: "expense", category: "housing",        _sum: { amount: 45000  }, _count: 1 },
  { type: "expense", category: "food",           _sum: { amount: 12000  }, _count: 3 },
  { type: "expense", category: "transport",      _sum: { amount: 3000   }, _count: 5 },
  { type: "expense", category: "entertainment",  _sum: { amount: 8000   }, _count: 2 },
];

// ─── getMonthlyStats ──────────────────────────────────────────────────────────

describe("stats.service — getMonthlyStats", () => {
  it("calcula correctamente ingresos, gastos y balance", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);

    const stats = await statsService.getMonthlyStats("u1", 2026, 4);

    expect(stats.totalIncome).toBe(180000);
    expect(stats.totalExpenses).toBe(45000 + 12000 + 3000 + 8000);
    expect(stats.balance).toBe(stats.totalIncome - stats.totalExpenses);
    expect(stats.month).toBe(4);
    expect(stats.year).toBe(2026);
  });

  it("agrupa gastos por categoría correctamente", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);

    const stats = await statsService.getMonthlyStats("u1", 2026, 4);

    expect(stats.byCategory.housing).toBe(45000);
    expect(stats.byCategory.food).toBe(12000);
    expect(stats.byCategory.transport).toBe(3000);
    expect(stats.byCategory.entertainment).toBe(8000);
    expect(stats.byCategory.health).toBe(0); // sin datos → 0
  });

  it("devuelve balance 0 si no hay transacciones", async () => {
    groupByMock.mockResolvedValue([]);

    const stats = await statsService.getMonthlyStats("u1", 2026, 4);

    expect(stats.totalIncome).toBe(0);
    expect(stats.totalExpenses).toBe(0);
    expect(stats.balance).toBe(0);
    expect(stats.transactionCount).toBe(0);
  });
});

// ─── getTopCategories ─────────────────────────────────────────────────────────

describe("stats.service — getTopCategories", () => {
  it("devuelve las categorías ordenadas por monto descendente", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);

    const top = await statsService.getTopCategories("u1", 2026, 4, 3);

    expect(top).toHaveLength(3);
    expect(top[0].category).toBe("housing");
    expect(top[0].amount).toBe(45000);
    expect(top[1].category).toBe("food");
  });

  it("calcula los porcentajes correctamente", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);

    const top = await statsService.getTopCategories("u1", 2026, 4, 5);
    const totalExpenses = 45000 + 12000 + 3000 + 8000;

    expect(top[0].percentage).toBeCloseTo((45000 / totalExpenses) * 100, 1);
  });

  it("devuelve lista vacía si no hay gastos", async () => {
    groupByMock.mockResolvedValue([
      { type: "income", category: "other", _sum: { amount: 100000 }, _count: 1 },
    ]);

    const top = await statsService.getTopCategories("u1", 2026, 4, 5);
    const nonZero = top.filter((t) => t.amount > 0);
    expect(nonZero).toHaveLength(0);
  });
});

// ─── checkBudgetAlerts ────────────────────────────────────────────────────────

describe("stats.service — checkBudgetAlerts", () => {
  const mockBudgets: any[] = [
    { id: "b1", category: "food",    limit: 10000, period: "monthly", userId: "u1", createdAt: new Date(), updatedAt: new Date() },
    { id: "b2", category: "housing", limit: 50000, period: "monthly", userId: "u1", createdAt: new Date(), updatedAt: new Date() },
  ];

  it("incluye solo presupuestos al 80% o más", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);
    budgetFindManyMock.mockResolvedValue(mockBudgets);

    const alerts = await statsService.checkBudgetAlerts("u1", 2026, 4);

    // food: 12000/10000 = 120% → debe aparecer
    // housing: 45000/50000 = 90% → debe aparecer
    expect(alerts.some((a) => a.category === "food")).toBe(true);
    expect(alerts.some((a) => a.category === "housing")).toBe(true);
  });

  it("marca como excedido cuando gasto > límite", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);
    budgetFindManyMock.mockResolvedValue(mockBudgets);

    const alerts = await statsService.checkBudgetAlerts("u1", 2026, 4);
    const foodAlert = alerts.find((a) => a.category === "food");

    expect(foodAlert?.isExceeded).toBe(true);
    expect(foodAlert?.percentage).toBeGreaterThan(100);
  });

  it("ordena las alertas por porcentaje descendente", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);
    budgetFindManyMock.mockResolvedValue(mockBudgets);

    const alerts = await statsService.checkBudgetAlerts("u1", 2026, 4);
    for (let i = 0; i < alerts.length - 1; i++) {
      expect(alerts[i].percentage).toBeGreaterThanOrEqual(alerts[i + 1].percentage);
    }
  });

  it("no incluye categorías bajo el 80%", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);
    budgetFindManyMock.mockResolvedValue([
      { id: "b3", category: "transport", limit: 100000, period: "monthly", userId: "u1", createdAt: new Date(), updatedAt: new Date() },
    ] as any);

    const alerts = await statsService.checkBudgetAlerts("u1", 2026, 4);
    // transport: 3000/100000 = 3% → no debe aparecer
    expect(alerts).toHaveLength(0);
  });
});

// ─── getSavingsRate ───────────────────────────────────────────────────────────

describe("stats.service — getSavingsRate", () => {
  it("calcula la tasa de ahorro correctamente", async () => {
    groupByMock.mockResolvedValue(mockGroupBy);

    const rate = await statsService.getSavingsRate("u1", 2026, 4);
    const totalExpenses = 45000 + 12000 + 3000 + 8000;
    const expected = ((180000 - totalExpenses) / 180000) * 100;

    expect(rate).toBeCloseTo(expected, 1);
  });

  it("devuelve 0 si no hay ingresos", async () => {
    groupByMock.mockResolvedValue([
      { type: "expense", category: "food", _sum: { amount: 5000 }, _count: 1 },
    ]);

    const rate = await statsService.getSavingsRate("u1", 2026, 4);
    expect(rate).toBe(0);
  });
});
