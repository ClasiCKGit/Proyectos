// src/__tests__/services/budgets.service.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import * as budgetsService from "./budgets.service";
import * as goalsService from "./savingsGoals.service";
import { prisma } from "../lib/prisma";

const db = prisma as jest.Mocked<typeof prisma>;

beforeEach(async () => await jest.clearAllMocks());

const mockBudget = {
  id: "b-1", category: "food" as const,
  limit: { toNumber: () => 25000 } as any,
  period: "monthly" as const,
  userId: "user-1", createdAt: new Date(), updatedAt: new Date(),
};

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

describe("budgets.service — listBudgets", () => {
  it("devuelve lista con amounts como números", async () => {
    jest.mocked(db.budget.findMany).mockResolvedValue([mockBudget]);

    const result = await budgetsService.listBudgets("user-1");

    expect(result[0].limit).toBe(25000);
    expect(typeof result[0].limit).toBe("number");
  });
});

describe("budgets.service — upsertBudget", () => {
  it("usa upsert por categoría", async () => {
    jest.mocked(db.budget.upsert).mockResolvedValue(mockBudget);

    await budgetsService.upsertBudget({ userId: "user-1", category: "food", limit: 25000, period: "monthly" });

    expect(db.budget.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId_category: { userId: "user-1", category: "food" },
        },
      })
    );
  });
});

describe("budgets.service — deleteBudget", () => {
  it("llama a prisma.budget.delete con el id correcto", async () => {
    jest.mocked(db.budget.findUniqueOrThrow).mockResolvedValue(mockBudget);
    jest.mocked(db.budget.delete).mockResolvedValue(mockBudget);

    await budgetsService.deleteBudget("b-1", "user-1");

    expect(db.budget.delete).toHaveBeenCalledWith({ where: { id: "b-1" } });
  });
});

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

const mockGoal = {
  id: "g-1", name: "Vacaciones",
  targetAmount: { toNumber: () => 150000 } as any,
  currentAmount: { toNumber: () => 60000 } as any,
  deadline: new Date("2026-12-01"),
  userId: "user-1", createdAt: new Date(), updatedAt: new Date(),
};

describe("savingsGoals.service — createSavingsGoal", () => {
  it("crea una meta y formatea los montos", async () => {
    jest.mocked(db.savingsGoal.create).mockResolvedValue(mockGoal);

    const result = await goalsService.createSavingsGoal({
      userId: "user-1",
      name: "Vacaciones",
      targetAmount: 150000,
      currentAmount: 0,
      deadline: "2026-12-01",
    });

    expect(result.targetAmount).toBe(150000);
    expect(result.currentAmount).toBe(60000);
    expect(result.deadline).toBe("2026-12-01");
  });

  it("convierte deadline a Date", async () => {
    jest.mocked(db.savingsGoal.create).mockResolvedValue(mockGoal);

    await goalsService.createSavingsGoal({
      userId: "user-1",
      name: "Test", targetAmount: 1000, currentAmount: 0, deadline: "2026-12-01",
    });

    const createArg = jest.mocked(db.savingsGoal.create).mock.calls[0][0] as any;
    expect(createArg.data.deadline).toBeInstanceOf(Date);
  });

  it("permite deadline null", async () => {
    jest.mocked(db.savingsGoal.create).mockResolvedValue({ ...mockGoal, deadline: null });

    const result = await goalsService.createSavingsGoal({
      userId: "user-1",
      name: "Sin fecha", targetAmount: 1000, currentAmount: 0,
    });

    expect(result.deadline).toBeNull();
  });
});

describe("savingsGoals.service — contributeToGoal", () => {
  it("suma el monto al current", async () => {
    jest.mocked(db.savingsGoal.findUniqueOrThrow).mockResolvedValue(mockGoal);
    jest.mocked(db.savingsGoal.update).mockResolvedValue({
      ...mockGoal,
      currentAmount: { toNumber: () => 70000 },
    } as any);

    const result = await goalsService.contributeToGoal("g-1", 10000);

    const updateArg = jest.mocked(db.savingsGoal.update).mock.calls[0][0] as any;
    expect(updateArg.data.currentAmount).toBe(70000); // 60000 + 10000
    expect(result.currentAmount).toBe(70000);
  });

  it("no supera el targetAmount al contribuir", async () => {
    jest.mocked(db.savingsGoal.findUniqueOrThrow).mockResolvedValue(mockGoal);
    jest.mocked(db.savingsGoal.update).mockResolvedValue({
      ...mockGoal,
      currentAmount: { toNumber: () => 150000 },
    } as any);

    await goalsService.contributeToGoal("g-1", 999999);

    const updateArg = jest.mocked(db.savingsGoal.update).mock.calls[0][0] as any;
    expect(updateArg.data.currentAmount).toBe(150000); // capped at target
  });
});

describe("savingsGoals.service — deleteSavingsGoal", () => {
  it("elimina la meta por id", async () => {
    jest.mocked(db.savingsGoal.delete).mockResolvedValue(mockGoal);

    await goalsService.deleteSavingsGoal("g-1");

    expect(db.savingsGoal.delete).toHaveBeenCalledWith({ where: { id: "g-1" } });
  });
});
