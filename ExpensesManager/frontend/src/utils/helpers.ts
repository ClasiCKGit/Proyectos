import type { Category, Transaction } from "../types";

// ─── FORMATTING ───────────────────────────────────────────────────────────────

export function formatCurrency(
  amount: number,
  currency = "ARS",
  locale = "es-AR"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "short",
    year: "numeric",
  },
  locale = "es-AR"
): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, options);
}

export function formatRelativeDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);

  if (diff === 0) return "Hoy";
  if (diff === -1) return "Ayer";
  if (diff === 1) return "Mañana";
  if (diff > -7 && diff < 0) return `Hace ${Math.abs(diff)} días`;
  return formatDate(isoDate);
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMonthYear(year: number, month: number, locale = "es-AR"): string {
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

// ─── CATEGORY LABELS ─────────────────────────────────────────────────────────

export const CATEGORY_LABELS: Record<Category, string> = {
  housing: "Vivienda",
  food: "Alimentación",
  transport: "Transporte",
  health: "Salud",
  entertainment: "Entretenimiento",
  education: "Educación",
  clothing: "Indumentaria",
  savings: "Ahorro",
  other: "Otros",
};

export const CATEGORY_ICONS: Record<Category, string> = {
  housing: "🏠",
  food: "🍽️",
  transport: "🚌",
  health: "💊",
  entertainment: "🎬",
  education: "📚",
  clothing: "👗",
  savings: "💰",
  other: "📦",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  housing: "#6366f1",
  food: "#f59e0b",
  transport: "#3b82f6",
  health: "#10b981",
  entertainment: "#ec4899",
  education: "#8b5cf6",
  clothing: "#f97316",
  savings: "#14b8a6",
  other: "#94a3b8",
};

// ─── VALIDATION ───────────────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

export function validateTransaction(data: Partial<Omit<Transaction, "id" | "createdAt" | "updatedAt">>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.description || data.description.trim().length === 0) {
    errors.push({ field: "description", message: "La descripción es obligatoria." });
  } else if (data.description.trim().length > 100) {
    errors.push({ field: "description", message: "Máximo 100 caracteres." });
  }

  if (data.amount === undefined || data.amount === null) {
    errors.push({ field: "amount", message: "El monto es obligatorio." });
  } else if (isNaN(data.amount) || data.amount <= 0) {
    errors.push({ field: "amount", message: "El monto debe ser mayor a 0." });
  } else if (data.amount > 999_999_999) {
    errors.push({ field: "amount", message: "El monto es demasiado grande." });
  }

  if (!data.date) {
    errors.push({ field: "date", message: "La fecha es obligatoria." });
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
    errors.push({ field: "date", message: "Formato de fecha inválido." });
  }

  if (!data.category) {
    errors.push({ field: "category", message: "La categoría es obligatoria." });
  }

  if (!data.type) {
    errors.push({ field: "type", message: "El tipo de transacción es obligatorio." });
  }

  return errors;
}

export function validateBudget(
  data: Partial<{ limit: number; category: Category }>
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!data.category) {
    errors.push({ field: "category", message: "La categoría es obligatoria." });
  }

  if (data.limit === undefined || data.limit === null) {
    errors.push({ field: "limit", message: "El límite es obligatorio." });
  } else if (isNaN(data.limit) || data.limit <= 0) {
    errors.push({ field: "limit", message: "El límite debe ser mayor a 0." });
  }

  return errors;
}

// ─── MISC HELPERS ─────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function parseAmountInput(raw: string): number {
  // Accept both "1.234,56" (es) and "1,234.56" (en)
  const normalized = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(normalized);
  return isNaN(value) ? 0 : value;
}
