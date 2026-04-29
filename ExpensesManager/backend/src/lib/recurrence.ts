// src/lib/recurrence.ts
// Lógica pura de cálculo de fechas — sin dependencias de Prisma.

import type { RecurrenceType } from "@prisma/client";

/**
 * Calcula la próxima fecha de vencimiento a partir de una fecha base.
 */
export function getNextDueDate(from: Date, recurrence: RecurrenceType): Date {
  const next = new Date(from);

  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
    case "none":
      throw new Error("RecurrenceType 'none' no es válido para transacciones recurrentes");
  }

  return next;
}

/**
 * Devuelve todas las fechas pendientes entre nextDueDate y hoy (inclusive).
 * Útil para recuperar transacciones atrasadas.
 */
export function getPendingDates(
  nextDueDate: Date,
  recurrence: RecurrenceType,
  endDate: Date | null,
  today = new Date()
): Date[] {
  const pending: Date[] = [];
  let current = new Date(nextDueDate);

  // Normalize today to start of day
  const todayNorm = new Date(today);
  todayNorm.setHours(23, 59, 59, 999);

  while (current <= todayNorm) {
    if (endDate && current > endDate) break;
    pending.push(new Date(current));
    current = getNextDueDate(current, recurrence);
  }

  return pending;
}

/**
 * Devuelve true si una recurrencia debe seguir procesándose.
 */
export function isStillActive(
  endDate: Date | null,
  nextDueDate: Date,
  today = new Date()
): boolean {
  if (endDate && nextDueDate > endDate) return false;
  return true;
}

/**
 * Descripción legible de la recurrencia.
 */
export function recurrenceLabel(recurrence: RecurrenceType): string {
  const labels: Record<string, string> = {
    daily: "Diaria",
    weekly: "Semanal",
    monthly: "Mensual",
    yearly: "Anual",
  };
  return labels[recurrence] ?? recurrence;
}
