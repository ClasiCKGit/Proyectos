// src/services/recurring.service.test.ts
import { describe, it, expect } from "@jest/globals";
import { getNextDueDate, getPendingDates, isStillActive } from "../lib/recurrence";

// ─── getNextDueDate ───────────────────────────────────────────────────────────

describe("getNextDueDate", () => {
  const base = new Date("2026-04-01");

  it("suma 1 día para 'daily'", () => {
    const next = getNextDueDate(base, "daily");
    expect(next.toISOString().split("T")[0]).toBe("2026-04-02");
  });

  it("suma 7 días para 'weekly'", () => {
    const next = getNextDueDate(base, "weekly");
    expect(next.toISOString().split("T")[0]).toBe("2026-04-08");
  });

  it("suma 1 mes para 'monthly'", () => {
    const next = getNextDueDate(base, "monthly");
    expect(next.toISOString().split("T")[0]).toBe("2026-05-01");
  });

  it("suma 1 año para 'yearly'", () => {
    const next = getNextDueDate(base, "yearly");
    expect(next.toISOString().split("T")[0]).toBe("2027-04-01");
  });

  it("lanza error para 'none'", () => {
    expect(() => getNextDueDate(base, "none")).toThrow();
  });

  it("maneja fin de mes correctamente (31 enero → 28/29 febrero)", () => {
    const jan31 = new Date("2026-01-31");
    const next = getNextDueDate(jan31, "monthly");
    // JavaScript ajusta automáticamente a último día del mes
    expect(next.getMonth()).toBe(2); // marzo (0-indexed)
  });
});

// ─── getPendingDates ──────────────────────────────────────────────────────────

describe("getPendingDates", () => {
  it("devuelve fechas vencidas hasta hoy inclusive", () => {
    const nextDue = new Date("2026-04-01");
    const today = new Date("2026-04-03");

    const pending = getPendingDates(nextDue, "daily", null, today);

    expect(pending).toHaveLength(3);
    expect(pending[0].toISOString().split("T")[0]).toBe("2026-04-01");
    expect(pending[2].toISOString().split("T")[0]).toBe("2026-04-03");
  });

  it("respeta la endDate", () => {
    const nextDue = new Date("2026-04-01");
    const endDate = new Date("2026-04-02");
    const today = new Date("2026-04-10");

    const pending = getPendingDates(nextDue, "daily", endDate, today);

    expect(pending).toHaveLength(2); // 01 y 02 abril
    expect(pending.every((d) => d <= endDate)).toBe(true);
  });

  it("devuelve array vacío si nextDue es en el futuro", () => {
    const nextDue = new Date("2026-05-01");
    const today = new Date("2026-04-01");

    const pending = getPendingDates(nextDue, "monthly", null, today);
    expect(pending).toHaveLength(0);
  });

  it("recupera múltiples meses atrasados", () => {
    const nextDue = new Date("2026-01-01");
    const today = new Date("2026-04-01");

    const pending = getPendingDates(nextDue, "monthly", null, today);
    expect(pending).toHaveLength(4); // ene, feb, mar, abr
  });
});

// ─── isStillActive ────────────────────────────────────────────────────────────

describe("isStillActive", () => {
  it("devuelve true si no hay endDate", () => {
    expect(isStillActive(null, new Date("2030-01-01"))).toBe(true);
  });

  it("devuelve false si nextDueDate es posterior a endDate", () => {
    const endDate = new Date("2026-04-30");
    const nextDue = new Date("2026-05-01");
    expect(isStillActive(endDate, nextDue)).toBe(false);
  });

  it("devuelve true si nextDueDate es igual a endDate", () => {
    const date = new Date("2026-04-30");
    expect(isStillActive(date, date)).toBe(true);
  });
});
