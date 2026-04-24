// src/__tests__/services/transactions.service.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import * as txService from "./transactions.service";
import { prisma } from "../lib/prisma";

const db = prisma as jest.Mocked<typeof prisma>;

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const USER_ID = "user-1";

const mockTx = {
  id: "tx-1",
  type: "expense" as const,
  amount: { toNumber: () => 5000 } as any,
  description: "Supermercado",
  category: "food" as const,
  date: new Date("2026-04-10"),
  notes: null,
  recurrence: "none" as const,
  userId: USER_ID,
  savingsGoalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [{ id: "tag-1", tag: "comida", transactionId: "tx-1" }],
};

const formattedTx = {
  ...mockTx,
  amount: 5000,
  date: "2026-04-10",
  tags: ["comida"],
};

beforeEach(async() => jest.clearAllMocks());

// ─── CREATE ───────────────────────────────────────────────────────────────────

describe("transactions.service — createTransaction", () => {
  it("crea una transacción con tags", async () => {
    jest.mocked(db.transaction.create).mockResolvedValue(mockTx);

    const result = await txService.createTransaction(USER_ID, {
      type: "expense",
      amount: 5000,
      description: "Supermercado",
      category: "food",
      date: "2026-04-10",
      tags: ["comida"],
      recurrence: "none",
    });

    expect(result.amount).toBe(5000);
    expect(result.tags).toEqual(["comida"]);
    expect(result.date).toBe("2026-04-10");

    const createArg = jest.mocked(db.transaction.create).mock.calls[0][0] as any;
    expect(createArg.data.user.connect.id).toBe(USER_ID);
    expect(createArg.data.tags.create).toEqual([{ tag: "comida" }]);
  });

  it("convierte el string de fecha a Date antes de guardar", async () => {
    jest.mocked(db.transaction.create).mockResolvedValue(mockTx);

    await txService.createTransaction(USER_ID, {
      type: "expense", amount: 100, description: "Test",
      category: "other", date: "2026-04-15", tags: [], recurrence: "none",
    });

    const createArg = jest.mocked(db.transaction.create).mock.calls[0][0] as any;
    expect(createArg.data.date).toBeInstanceOf(Date);
  });
});

// ─── GET BY ID ────────────────────────────────────────────────────────────────

describe("transactions.service — getTransactionById", () => {
  it("devuelve la transacción si pertenece al usuario", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);

    const result = await txService.getTransactionById(USER_ID, "tx-1");
    expect(result?.id).toBe("tx-1");
    expect(result?.amount).toBe(5000);
  });

  it("devuelve null si no existe o es de otro usuario", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(null);

    const result = await txService.getTransactionById(USER_ID, "tx-999");
    expect(result).toBeNull();
  });
});

// ─── UPDATE ───────────────────────────────────────────────────────────────────

describe("transactions.service — updateTransaction", () => {
  it("actualiza solo los campos enviados", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);
    const txUpdate = jest.fn().mockImplementation(() => Promise.resolve({ ...mockTx, description: "Carnicería" } as any)) as any;

    jest.mocked(db.$transaction).mockImplementation(async (fn: any) =>
      fn({
        transactionTag: { deleteMany: jest.fn(), createMany: jest.fn() },
        transaction: { update: txUpdate },
      })
    );

    const result = await txService.updateTransaction(USER_ID, "tx-1", { description: "Carnicería" });
    expect(result?.description).toBe("Carnicería");
  });

  it("devuelve null si la transacción no es del usuario", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(null);

    const result = await txService.updateTransaction("other-user", "tx-1", { description: "X" });
    expect(result).toBeNull();
  });

  it("reemplaza los tags cuando se pasan en el update", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);

    const deleteMany = jest.fn();
    const createMany = jest.fn();
    const update = jest.fn().mockImplementation(() => Promise.resolve({ ...mockTx, tags: [{ tag: "nuevo" }] } as any)) as any;

    jest.mocked(db.$transaction).mockImplementation(async (fn: any) =>
      fn({ transactionTag: { deleteMany, createMany }, transaction: { update } })
    );

    await txService.updateTransaction(USER_ID, "tx-1", { tags: ["nuevo"] });

    expect(deleteMany).toHaveBeenCalledWith({ where: { transactionId: "tx-1" } });
    expect(createMany).toHaveBeenCalledWith({ data: [{ tag: "nuevo", transactionId: "tx-1" }] });
  });
});

// ─── DELETE ───────────────────────────────────────────────────────────────────

describe("transactions.service — deleteTransaction", () => {
  it("elimina y devuelve true si es del usuario", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);
    jest.mocked(db.transaction.delete).mockResolvedValue(mockTx);

    const result = await txService.deleteTransaction(USER_ID, "tx-1");
    expect(result).toBe(true);
    expect(db.transaction.delete).toHaveBeenCalledWith({ where: { id: "tx-1" } });
  });

  it("devuelve false si no existe o es de otro usuario", async () => {
    jest.mocked(db.transaction.findFirst).mockResolvedValue(null);

    const result = await txService.deleteTransaction(USER_ID, "tx-999");
    expect(result).toBe(false);
    expect(db.transaction.delete).not.toHaveBeenCalled();
  });
});

// ─── LIST ─────────────────────────────────────────────────────────────────────

describe("transactions.service — listTransactions", () => {
  it("pagina correctamente los resultados", async () => {
    jest.mocked(db.$transaction).mockResolvedValue([25, [mockTx, mockTx]]);

    const result = await txService.listTransactions(USER_ID, {
      page: 2, pageSize: 10, sortField: "date", sortDir: "desc",
    });

    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.page).toBe(2);
  });

  it("filtra siempre por userId", async () => {
    jest.mocked(db.$transaction).mockResolvedValue([0, []]);

    await txService.listTransactions(USER_ID, {
      page: 1, pageSize: 20, sortField: "date", sortDir: "desc",
    });

    expect(db.transaction.count).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: USER_ID }) }),
    );
  });

  it("aplica filtro de búsqueda de texto", async () => {
    jest.mocked(db.$transaction).mockResolvedValue([0, []]);

    await txService.listTransactions(USER_ID, {
      page: 1, pageSize: 20, sortField: "date", sortDir: "desc", search: "super",
    });

    expect(db.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({ description: expect.objectContaining({ contains: "super" }) }),
          ]),
        }),
      }),
    );
  });
});
