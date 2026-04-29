// src/schemas/recurring.schemas.ts
import { z } from "zod";

const CategoryEnum = z.enum([
  "housing", "food", "transport", "health",
  "entertainment", "education", "clothing", "savings", "other",
]);

const RecurrenceEnum = z.enum(["daily", "weekly", "monthly", "yearly"]);

export const createRecurringSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("El monto debe ser mayor a 0").max(999_999_999),
  description: z.string().min(1, "La descripción es obligatoria").max(100),
  category: CategoryEnum,
  recurrence: RecurrenceEnum,
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato inválido (YYYY-MM-DD)"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .nullable(),
  tags: z.array(z.string().max(50)).max(10).default([]),
  notes: z.string().max(500).optional().nullable(),
});

export const updateRecurringSchema = createRecurringSchema
  .omit({ startDate: true }) // no se puede cambiar la fecha de inicio
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  });

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;
