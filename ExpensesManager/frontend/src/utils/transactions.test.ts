// src/__tests__/utils/transactions.test.ts
import { describe, it, expect } from "vitest";
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  filterTransactions,
  sortTransactions,
  paginateTransactions,
  getTransactionsByMonth,
  getAllTags,
} from "../utils/transactions";
import type { Transaction } from "../types";

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const base: Omit<Transaction, "id" | "createdAt" | "updatedAt"> = {
  type: "expense",
  amount: 5000,
  description: "Supermercado",
  category: "food",
  date: "2026-04-10",
  tags: ["comida"],
  recurrence: "none",
};

const makeTx = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: "tx-" + Math.random().toString(36).slice(2),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...base,
  ...overrides,
});

// ─── createTransaction ────────────────────────────────────────────────────────

describe("createTransaction", () => {
  it("genera un id único", () => {
    const a = createTransaction(base);
    const b = createTransaction(base);
    expect(a.id).not.toBe(b.id);
  });

  it("asigna createdAt y updatedAt", () => {
    const tx = createTransaction(base);
    expect(tx.createdAt).toBeDefined();
    expect(tx.updatedAt).toBeDefined();
  });
});

// ─── updateTransaction ────────────────────────────────────────────────────────

describe("updateTransaction", () => {
  it("actualiza solo los campos indicados", () => {
    const tx = makeTx();
    const updated = updateTransaction(tx, { description: "Carnicería" });
    expect(updated.description).toBe("Carnicería");
    expect(updated.amount).toBe(tx.amount);
  });

  it("preserva el id original", () => {
    const tx = makeTx({ id: "original-id" });
    const updated = updateTransaction(tx, { amount: 9999 });
    expect(updated.id).toBe("original-id");
  });

  it("actualiza updatedAt", () => {
    const tx = makeTx({ updatedAt: "2020-01-01T00:00:00.000Z" });
    const updated = updateTransaction(tx, { amount: 1 });
    expect(updated.updatedAt).not.toBe("2020-01-01T00:00:00.000Z");
  });
});

// ─── deleteTransaction ────────────────────────────────────────────────────────

describe("deleteTransaction", () => {
  it("elimina la transacción correcta", () => {
    const txs = [makeTx({ id: "a" }), makeTx({ id: "b" }), makeTx({ id: "c" })];
    const result = deleteTransaction(txs, "b");
    expect(result).toHaveLength(2);
    expect(result.find((t) => t.id === "b")).toBeUndefined();
  });

  it("no modifica si el id no existe", () => {
    const txs = [makeTx({ id: "a" })];
    const result = deleteTransaction(txs, "no-existe");
    expect(result).toHaveLength(1);
  });
});

// ─── filterTransactions ───────────────────────────────────────────────────────

describe("filterTransactions", () => {
  const txs = [
    makeTx({ id: "1", type: "expense", category: "food",    amount: 1000, date: "2026-04-01", tags: ["super"] }),
    makeTx({ id: "2", type: "income",  category: "other",   amount: 5000, date: "2026-04-15", tags: [] }),
    makeTx({ id: "3", type: "expense", category: "housing", amount: 45000, date: "2026-03-01", tags: [] }),
  ];

  it("filtra por tipo", () => {
    expect(filterTransactions(txs, { type: "expense" })).toHaveLength(2);
    expect(filterTransactions(txs, { type: "income"  })).toHaveLength(1);
  });

  it("filtra por categoría", () => {
    expect(filterTransactions(txs, { category: "food" })).toHaveLength(1);
  });

  it("filtra por rango de fechas", () => {
    expect(filterTransactions(txs, { dateFrom: "2026-04-01", dateTo: "2026-04-30" })).toHaveLength(2);
  });

  it("filtra por rango de montos", () => {
    expect(filterTransactions(txs, { amountMin: 2000, amountMax: 50000 })).toHaveLength(2);
  });

  it("filtra por búsqueda de texto en descripción", () => {
    const result = filterTransactions(txs, { search: "supermercado" });
    expect(result.length).toBeGreaterThan(0);
  });

  it("filtra por tags", () => {
    expect(filterTransactions(txs, { tags: ["super"] })).toHaveLength(1);
  });

  it("devuelve todos con filtro vacío", () => {
    expect(filterTransactions(txs, {})).toHaveLength(3);
  });
});

// ─── sortTransactions ─────────────────────────────────────────────────────────

describe("sortTransactions", () => {
  const txs = [
    makeTx({ date: "2026-04-01", amount: 1000, description: "B" }),
    makeTx({ date: "2026-04-03", amount: 500,  description: "A" }),
    makeTx({ date: "2026-04-02", amount: 2000, description: "C" }),
  ];

  it("ordena por fecha descendente", () => {
    const sorted = sortTransactions(txs, { field: "date", direction: "desc" });
    expect(sorted[0].date).toBe("2026-04-03");
    expect(sorted[2].date).toBe("2026-04-01");
  });

  it("ordena por monto ascendente", () => {
    const sorted = sortTransactions(txs, { field: "amount", direction: "asc" });
    expect(sorted[0].amount).toBe(500);
    expect(sorted[2].amount).toBe(2000);
  });

  it("ordena por descripción alfabéticamente", () => {
    const sorted = sortTransactions(txs, { field: "description", direction: "asc" });
    expect(sorted[0].description).toBe("A");
    expect(sorted[2].description).toBe("C");
  });

  it("no muta el array original", () => {
    const original = [...txs];
    sortTransactions(txs, { field: "date", direction: "asc" });
    expect(txs).toEqual(original);
  });
});

// ─── paginateTransactions ─────────────────────────────────────────────────────

describe("paginateTransactions", () => {
  const txs = Array.from({ length: 25 }, (_, i) => makeTx({ id: String(i) }));

  it("devuelve la página correcta", () => {
    const result = paginateTransactions(txs, { page: 2, pageSize: 10 });
    expect(result.data).toHaveLength(10);
    expect(result.data[0].id).toBe("10");
  });

  it("calcula totalPages correctamente", () => {
    const result = paginateTransactions(txs, { page: 1, pageSize: 10 });
    expect(result.totalPages).toBe(3);
    expect(result.total).toBe(25);
  });

  it("última página puede tener menos elementos", () => {
    const result = paginateTransactions(txs, { page: 3, pageSize: 10 });
    expect(result.data).toHaveLength(5);
  });
});

// ─── getTransactionsByMonth ───────────────────────────────────────────────────

describe("getTransactionsByMonth", () => {
  const txs = [
    makeTx({ date: "2026-04-01" }),
    makeTx({ date: "2026-04-30" }),
    makeTx({ date: "2026-03-15" }),
    makeTx({ date: "2025-04-01" }), // mismo mes, distinto año
  ];

  it("filtra correctamente por año y mes", () => {
    const result = getTransactionsByMonth(txs, 2026, 4);
    expect(result).toHaveLength(2);
  });

  it("no incluye el mismo mes de otro año", () => {
    const result = getTransactionsByMonth(txs, 2026, 4);
    expect(result.every((t) => t.date.startsWith("2026-04"))).toBe(true);
  });
});

// ─── getAllTags ────────────────────────────────────────────────────────────────

describe("getAllTags", () => {
  it("devuelve tags únicos y ordenados", () => {
    const txs = [
      makeTx({ tags: ["comida", "super"] }),
      makeTx({ tags: ["comida", "fijo"] }),
      makeTx({ tags: [] }),
    ];
    const tags = getAllTags(txs);
    expect(tags).toEqual(["comida", "fijo", "super"]);
  });

  it("devuelve array vacío si no hay tags", () => {
    expect(getAllTags([makeTx({ tags: [] })])).toEqual([]);
  });
});
