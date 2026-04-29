// src/schemas/index.ts
import { z } from "zod";

const CategoryEnum = z.enum([
  "housing", "food", "transport", "health",
  "entertainment", "education", "clothing", "savings", "other",
]);

const RecurrenceEnum = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const createTransactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("El monto debe ser mayor a 0").max(999_999_999),
  description: z.string().min(1, "La descripción es obligatoria").max(100),
  category: CategoryEnum.nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  tags: z.array(z.string().max(50)).max(10).default([]),
  notes: z.string().max(500).optional(),
  recurrence: RecurrenceEnum.default("none"),
  savingsGoalId: z.string().optional()
});

export const updateTransactionSchema = createTransactionSchema.partial();

export const transactionFiltersSchema = z.object({
  type: z.enum(["income", "expense"]).optional(),
  category: CategoryEnum.optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amountMin: z.coerce.number().nonnegative().optional(),
  amountMax: z.coerce.number().nonnegative().optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sortField: z.enum(["date", "amount", "description", "category"]).default("date"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
});

// ─── BUDGETS ──────────────────────────────────────────────────────────────────

export const upsertBudgetSchema = z.object({
  userId: z.string().optional(), // Provided by backend from auth token
  category: CategoryEnum,
  limit: z.number().positive("El límite debe ser mayor a 0"),
  period: z.enum(["monthly", "yearly"]).default("monthly"),
});

// ─── SAVINGS GOALS ────────────────────────────────────────────────────────────

export const createSavingsGoalSchema = z.object({
  userId: z.string().optional(), // Provided by backend from auth token
  name: z.string().min(1).max(100),
  targetAmount: z.number().positive(),
  currentAmount: z.number().nonnegative().default(0),
  deadline: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export const contributeGoalSchema = z.object({
  amount: z.number().positive("El monto debe ser mayor a 0"),
});

// ─── STATS ────────────────────────────────────────────────────────────────────

export const monthStatsSchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});
