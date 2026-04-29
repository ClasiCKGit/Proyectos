// src/services/recurring.service.ts
import { prisma } from "../lib/prisma";
import { getNextDueDate, getPendingDates, isStillActive } from "../lib/recurrence";
import type { CreateRecurringInput, UpdateRecurringInput } from "../schemas/recurring.schemas";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function fmt(r: any) {
  return {
    ...r,
    amount: Number(r.amount),
    startDate: r.startDate.toISOString().split("T")[0],
    nextDueDate: r.nextDueDate.toISOString().split("T")[0],
    endDate: r.endDate ? r.endDate.toISOString().split("T")[0] : null,
    lastRunAt: r.lastRunAt?.toISOString() ?? null,
    tags: r.tags?.map((t: any) => t.tag) ?? [],
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function listRecurring(userId: string) {
  const rows = await prisma.recurringTransaction.findMany({
    where: { userId },
    include: { tags: true },
    orderBy: { nextDueDate: "asc" },
  });
  return rows.map(fmt);
}

export async function getRecurringById(userId: string, id: string) {
  const row = await prisma.recurringTransaction.findFirst({
    where: { id, userId },
    include: { tags: true },
  });
  return row ? fmt(row) : null;
}

export async function createRecurring(userId: string, data: CreateRecurringInput) {
  const { tags, startDate, endDate, ...rest } = data;
  const start = new Date(startDate);

  const row = await prisma.recurringTransaction.create({
    data: {
      ...rest,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextDueDate: start,  // primera ejecución = startDate
      userId,
      tags: { create: tags.map((tag) => ({ tag })) },
    },
    include: { tags: true },
  });
  return fmt(row);
}

export async function updateRecurring(
  userId: string,
  id: string,
  data: UpdateRecurringInput
) {
  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!existing) return null;

  const { tags, endDate, ...rest } = data;

  const row = await prisma.$transaction(async (db) => {
    if (tags !== undefined) {
      await db.recurringTransactionTag.deleteMany({ where: { recurringTransactionId: id } });
      await db.recurringTransactionTag.createMany({
        data: tags.map((tag) => ({ tag, recurringTransactionId: id })),
      });
    }
    return db.recurringTransaction.update({
      where: { id },
      data: {
        ...rest,
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
      },
      include: { tags: true },
    });
  });

  return fmt(row);
}

export async function deleteRecurring(userId: string, id: string) {
  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!existing) return false;
  await prisma.recurringTransaction.delete({ where: { id } });
  return true;
}

export async function toggleRecurring(userId: string, id: string) {
  const existing = await prisma.recurringTransaction.findFirst({ where: { id, userId } });
  if (!existing) return null;
  const row = await prisma.recurringTransaction.update({
    where: { id },
    data: { isActive: !existing.isActive },
    include: { tags: true },
  });
  return fmt(row);
}

// ─── PROCESSOR ────────────────────────────────────────────────────────────────

export interface ProcessResult {
  processed: number;
  generated: Array<{ recurringId: string; description: string; date: string; amount: number }>;
  deactivated: number;
}

/**
 * Procesa todas las recurrencias activas vencidas para un usuario.
 * Genera las transacciones faltantes y actualiza nextDueDate.
 * Se llama tanto desde el cron como desde el hook de login.
 */
export async function processRecurringForUser(userId: string): Promise<ProcessResult> {
  const result: ProcessResult = { processed: 0, generated: [], deactivated: 0 };
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = await prisma.recurringTransaction.findMany({
    where: {
      userId,
      isActive: true,
      nextDueDate: { lte: today },
    },
    include: { tags: true },
  });

  for (const recurring of due) {
    const pendingDates = getPendingDates(
      recurring.nextDueDate,
      recurring.recurrence,
      recurring.endDate
    );

    if (pendingDates.length === 0) continue;

    // Generate one Transaction per pending date
    for (const date of pendingDates) {
      await prisma.transaction.create({
        data: {
          type: recurring.type,
          amount: recurring.amount,
          description: recurring.description,
          category: recurring.category,
          notes: recurring.notes,
          recurrence: "none", // las generadas no son recurrentes por sí mismas
          date,
          userId,
          recurringTransactionId: recurring.id,
          tags: {
            create: recurring.tags.map((t) => ({ tag: t.tag })),
          },
        },
      });

      result.generated.push({
        recurringId: recurring.id,
        description: recurring.description,
        date: date.toISOString().split("T")[0],
        amount: Number(recurring.amount),
      });
    }

    // Calculate next due date after all pending
    const lastDate = pendingDates[pendingDates.length - 1];
    const nextDue = getNextDueDate(lastDate, recurring.recurrence);
    const stillActive = isStillActive(recurring.endDate, nextDue);

    await prisma.recurringTransaction.update({
      where: { id: recurring.id },
      data: {
        nextDueDate: nextDue,
        lastRunAt: new Date(),
        isActive: stillActive,
      },
    });

    if (!stillActive) result.deactivated++;
    result.processed++;
  }

  return result;
}

/**
 * Procesa TODOS los usuarios — llamado desde el cron global.
 */
export async function processAllRecurring(): Promise<{
  usersProcessed: number;
  totalGenerated: number;
  totalDeactivated: number;
}> {
  // Find all users with due recurring transactions
  const users = await prisma.recurringTransaction.findMany({
    where: { isActive: true, nextDueDate: { lte: new Date() } },
    select: { userId: true },
    distinct: ["userId"],
  });

  let totalGenerated = 0;
  let totalDeactivated = 0;

  for (const { userId } of users) {
    const result = await processRecurringForUser(userId);
    totalGenerated += result.generated.length;
    totalDeactivated += result.deactivated;
  }

  return { usersProcessed: users.length, totalGenerated, totalDeactivated };
}

// ─── UPCOMING PREVIEW ─────────────────────────────────────────────────────────

/**
 * Devuelve las próximas N ocurrencias de todas las recurrencias activas del usuario.
 * Útil para mostrar un calendario/preview en el frontend.
 */
export async function getUpcomingOccurrences(
  userId: string,
  daysAhead = 30
): Promise<Array<{ recurringId: string; description: string; date: string; amount: number; type: string; category: string }>> {
  const actives = await prisma.recurringTransaction.findMany({
    where: { userId, isActive: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(today);
  limit.setDate(limit.getDate() + daysAhead);

  const upcoming: Array<any> = [];

  for (const r of actives) {
    let current = new Date(r.nextDueDate);

    while (current <= limit) {
      if (r.endDate && current > r.endDate) break;
      upcoming.push({
        recurringId: r.id,
        description: r.description,
        date: current.toISOString().split("T")[0],
        amount: Number(r.amount),
        type: r.type,
        category: r.category,
      });
      current = getNextDueDate(current, r.recurrence);
    }
  }

  return upcoming.sort((a, b) => a.date.localeCompare(b.date));
}
