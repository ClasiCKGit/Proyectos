// src/services/budgets.service.ts
import { prisma } from "../lib/prisma";
import type { z } from "zod";
import type { upsertBudgetSchema } from "../schemas";

type UpsertInput = z.infer<typeof upsertBudgetSchema>;

function fmt(b: any) {
  return { ...b, limit: Number(b.limit) };
}

export async function listBudgets() {
  const rows = await prisma.budget.findMany({ orderBy: { category: "asc" } });
  return rows.map(fmt);
}

export async function upsertBudget(data: UpsertInput) {
  const result = await prisma.budget.upsert({
    where: { category: data.category },
    update: { limit: data.limit, period: data.period },
    create: data,
  });
  return fmt(result);
}

export async function deleteBudget(id: string) {
  await prisma.budget.delete({ where: { id } });
}
