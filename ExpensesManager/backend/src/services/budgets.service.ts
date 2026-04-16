// src/services/budgets.service.ts
import { prisma } from "../lib/prisma";
import type { z } from "zod";
import type { upsertBudgetSchema } from "../schemas";

type UpsertInput = z.infer<typeof upsertBudgetSchema>;

function fmt(b: any) {
  return { ...b, limit: Number(b.limit) };
}

export async function listBudgets(userId: string) {
  const rows = await prisma.budget.findMany({
    where: { userId },
    orderBy: { category: "asc" }
  });
  return rows.map(fmt);
}

export async function upsertBudget(data: UpsertInput) {
  const userId = data.userId;
  if (!userId) {
    throw new Error("userId es requerido");
  }
  const {category} = data
  const result = await prisma.budget.upsert({
    where: {
      userId_category: {
        userId,
        category,
      },
    },
    update: { limit: data.limit, period: data.period },
    create: { userId, category, limit: data.limit, period: data.period },
  });
  return fmt(result);
}

export async function deleteBudget(id: string, userId: string) {
  // Verify ownership before deleting
  const budget = await prisma.budget.findUnique({ where: { id } });
  if (!budget) {
    throw new Error("Presupuesto no encontrado");
  }
  if (budget.userId !== userId) {
    throw new Error("No tienes permiso para eliminar este presupuesto");
  }
  await prisma.budget.delete({ where: { id } });
}
