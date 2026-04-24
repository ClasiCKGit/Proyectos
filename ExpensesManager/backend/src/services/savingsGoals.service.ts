// src/services/savingsGoals.service.ts
import { prisma } from "../lib/prisma";
import type { z } from "zod";
import type { createSavingsGoalSchema, updateSavingsGoalSchema } from "../schemas";

type CreateInput = z.infer<typeof createSavingsGoalSchema>;
type UpdateInput = z.infer<typeof updateSavingsGoalSchema>;

function fmt(g: any) {
  return {
    ...g,
    targetAmount: typeof g.targetAmount === "number"
      ? g.targetAmount
      : typeof g.targetAmount?.toNumber === "function"
        ? g.targetAmount.toNumber()
        : Number(g.targetAmount),
    currentAmount: typeof g.currentAmount === "number"
      ? g.currentAmount
      : typeof g.currentAmount?.toNumber === "function"
        ? g.currentAmount.toNumber()
        : Number(g.currentAmount),
    deadline: g.deadline ? g.deadline.toISOString().split("T")[0] : null,
  };
}

export async function listSavingsGoals(userId:string) {
  const rows = await prisma.savingsGoal.findMany({ 
    where:{ userId },
    orderBy: { createdAt: "asc" } 
  });
  return rows.map(fmt);
}

export async function createSavingsGoal(data: CreateInput) {
  const userId = data.userId;
  if (!userId || typeof userId !== 'string') {
    throw new Error("userId es requerido y debe ser válido");
  }
  
  try {
    const result = await prisma.savingsGoal.create({
      data: {
        name: data.name,
        targetAmount: String(data.targetAmount),
        currentAmount: String(data.currentAmount),
        deadline: data.deadline ? new Date(data.deadline) : null,
        userId,
      },
    });
    return fmt(result);
  } catch (error) {
    throw error;
  }
}

export async function updateSavingsGoal(id: string, data: UpdateInput) {
  const result = await prisma.savingsGoal.update({
    where: { id },
    data: {
      ...data,
      ...(data.deadline !== undefined
        ? { deadline: data.deadline ? new Date(data.deadline) : null }
        : {}),
    },
  });
  return fmt(result);
}

export async function contributeToGoal(id: string, amount: number) {
  const goal = await prisma.savingsGoal.findUniqueOrThrow({ where: { id } });
  const newAmount = Math.min(
    goal.currentAmount.toNumber() + amount,
    goal.targetAmount.toNumber()
  );
  const result = await prisma.savingsGoal.update({
    where: { id },
    data: { currentAmount: newAmount },
  });
  return fmt(result);
}

export async function deleteSavingsGoal(id: string) {
  await prisma.savingsGoal.delete({ where: { id } });
}
