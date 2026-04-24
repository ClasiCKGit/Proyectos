// src/__tests__/utils/helpers.test.ts
import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatDate,
  formatRelativeDate,
  formatPercentage,
  validateTransaction,
  validateBudget,
  parseAmountInput,
  todayISO,
} from "../utils/helpers";

// ─── formatCurrency ───────────────────────────────────────────────────────────

describe("formatCurrency", () => {
  it("formatea pesos argentinos por defecto", () => {
    const result = formatCurrency(12500);
    expect(result).toContain("12.500");
  });

  it("formatea números negativos", () => {
    const result = formatCurrency(-5000);
    expect(result).toContain("5.000");
  });

  it("formatea cero", () => {
    const result = formatCurrency(0);
    expect(result).toContain("0");
  });
});

// ─── formatDate ───────────────────────────────────────────────────────────────

describe("formatDate", () => {
  it("formatea una fecha ISO correctamente", () => {
    const result = formatDate("2026-04-15");
    expect(result).toContain("15");
    expect(result.toLowerCase()).toContain("abr");
  });

  it("no desplaza la fecha por zona horaria", () => {
    const result = formatDate("2026-01-01");
    expect(result).toContain("1");
    expect(result.toLowerCase()).toContain("ene");
  });
});

// ─── formatRelativeDate ───────────────────────────────────────────────────────

describe("formatRelativeDate", () => {
  it("devuelve 'Hoy' para la fecha de hoy", () => {
    expect(formatRelativeDate(todayISO())).toBe("Hoy");
  });

  it("devuelve 'Ayer' para ayer", () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const iso = yesterday.toISOString().split("T")[0];
    expect(formatRelativeDate(iso)).toBe("Ayer");
  });

  it("devuelve 'Mañana' para mañana", () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const iso = tomorrow.toISOString().split("T")[0];
    expect(formatRelativeDate(iso)).toBe("Mañana");
  });

  it("devuelve 'Hace N días' para días recientes", () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    const iso = d.toISOString().split("T")[0];
    expect(formatRelativeDate(iso)).toContain("3 días");
  });
});

// ─── formatPercentage ─────────────────────────────────────────────────────────

describe("formatPercentage", () => {
  it("formatea con 1 decimal por defecto", () => {
    expect(formatPercentage(85.555)).toBe("85.6%");
  });

  it("respeta el parámetro decimals", () => {
    expect(formatPercentage(85.555, 0)).toBe("86%");
    expect(formatPercentage(85.555, 2)).toBe("85.56%");
  });
});

// ─── validateTransaction ──────────────────────────────────────────────────────

describe("validateTransaction", () => {
  const valid = {
    type: "expense" as const,
    amount: 1000,
    description: "Test",
    category: "food" as const,
    date: "2026-04-15",
  };

  it("no devuelve errores con datos válidos", () => {
    expect(validateTransaction(valid)).toHaveLength(0);
  });

  it("requiere descripción", () => {
    const errors = validateTransaction({ ...valid, description: "" });
    expect(errors.some((e) => e.field === "description")).toBe(true);
  });

  it("requiere monto mayor a 0", () => {
    expect(validateTransaction({ ...valid, amount: 0 })).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "amount" })])
    );
    expect(validateTransaction({ ...valid, amount: -100 })).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "amount" })])
    );
  });

  it("valida formato de fecha", () => {
    const errors = validateTransaction({ ...valid, date: "15/04/2026" });
    expect(errors.some((e) => e.field === "date")).toBe(true);
  });

  it("rechaza montos excesivos", () => {
    const errors = validateTransaction({ ...valid, amount: 1_000_000_000 });
    expect(errors.some((e) => e.field === "amount")).toBe(true);
  });

  it("limita descripción a 100 caracteres", () => {
    const errors = validateTransaction({ ...valid, description: "x".repeat(101) });
    expect(errors.some((e) => e.field === "description")).toBe(true);
  });
});

// ─── validateBudget ───────────────────────────────────────────────────────────

describe("validateBudget", () => {
  it("no devuelve errores con datos válidos", () => {
    expect(validateBudget({ category: "food", limit: 10000 })).toHaveLength(0);
  });

  it("requiere categoría", () => {
    const errors = validateBudget({ limit: 10000 });
    expect(errors.some((e) => e.field === "category")).toBe(true);
  });

  it("requiere límite mayor a 0", () => {
    expect(validateBudget({ category: "food", limit: 0 })).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: "limit" })])
    );
  });
});

// ─── parseAmountInput ─────────────────────────────────────────────────────────

describe("parseAmountInput", () => {
  it("parsea formato argentino (punto como separador de miles)", () => {
    expect(parseAmountInput("1.234,56")).toBeCloseTo(1234.56);
  });

  it("parsea formato inglés (coma como separador de miles)", () => {
    expect(parseAmountInput("1,234.56")).toBeCloseTo(1234.56);
  });

  it("devuelve 0 para input inválido", () => {
    expect(parseAmountInput("abc")).toBe(0);
    expect(parseAmountInput("")).toBe(0);
  });

  it("parsea enteros simples", () => {
    expect(parseAmountInput("5000")).toBe(5000);
  });
});
