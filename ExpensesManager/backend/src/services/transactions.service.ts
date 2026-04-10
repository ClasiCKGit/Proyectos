// src/services/transactions.service.ts
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import type { z } from "zod";
import type {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
} from "../schemas";

type CreateInput = z.infer<typeof createTransactionSchema>;
type UpdateInput = z.infer<typeof updateTransactionSchema>;
type Filters = z.infer<typeof transactionFiltersSchema>;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Attach tags array to a transaction result */
function formatTx(tx: any) {
  return {
    ...tx,
    amount: Number(tx.amount),
    date: tx.date.toISOString().split("T")[0],
    tags: tx.tags?.map((t: any) => t.tag) ?? [],
  };
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createTransaction(data: CreateInput) {
  const { tags, date, ...rest } = data;

  const tx = await prisma.transaction.create({
    data: {
      ...rest,
      date: new Date(date),
      tags: {
        create: tags.map((tag) => ({ tag })),
      },
    },
    include: { tags: true },
  });

  return formatTx(tx);
}

export async function getTransactionById(id: string) {
  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { tags: true },
  });
  if (!tx) return null;
  return formatTx(tx);
}

export async function updateTransaction(id: string, data: UpdateInput) {
  const { tags, date, ...rest } = data;

  // Replace tags in a single transaction
  const tx = await prisma.$transaction(async (db) => {
    if (tags !== undefined) {
      await db.transactionTag.deleteMany({ where: { transactionId: id } });
      await db.transactionTag.createMany({
        data: tags.map((tag) => ({ tag, transactionId: id })),
      });
    }

    return db.transaction.update({
      where: { id },
      data: {
        ...rest,
        ...(date ? { date: new Date(date) } : {}),
      },
      include: { tags: true },
    });
  });

  return formatTx(tx);
}

export async function deleteTransaction(id: string) {
  await prisma.transaction.delete({ where: { id } });
}

// ─── LIST WITH FILTERS ────────────────────────────────────────────────────────

export async function listTransactions(filters: Filters) {
  const {
    type, category, dateFrom, dateTo, amountMin, amountMax,
    search, page, pageSize, sortField, sortDir,
  } = filters;

  const where: Prisma.TransactionWhereInput = {
    ...(type && { type }),
    ...(category && { category }),
    ...(dateFrom || dateTo
      ? {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }
      : {}),
    ...(amountMin !== undefined || amountMax !== undefined
      ? {
          amount: {
            ...(amountMin !== undefined && { gte: amountMin }),
            ...(amountMax !== undefined && { lte: amountMax }),
          },
        }
      : {}),
    ...(search && {
      OR: [
        { description: { contains: search } },
        { notes: { contains: search } },
        { tags: { some: { tag: { contains: search } } } },
      ],
    }),
  };

  const orderBy: Prisma.TransactionOrderByWithRelationInput =
    sortField === "date"
      ? { date: sortDir }
      : sortField === "amount"
      ? { amount: sortDir }
      : sortField === "description"
      ? { description: sortDir }
      : { category: sortDir };

  const [total, rows] = await prisma.$transaction([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { tags: true },
    }),
  ]);

  return {
    data: rows.map(formatTx),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
