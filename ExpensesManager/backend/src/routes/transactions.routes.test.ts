// src/__tests__/routes/transactions.routes.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

const app = createApp();
const db = prisma as jest.Mocked<typeof prisma>;

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  email: "tx@test.com",
  name: "TX User",
  passwordHash: bcrypt.hashSync("Password1", 1),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockToken = {
  id: "tok-1", token: "rt", userId: "user-1",
  expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(),
};

const mockTx: any = {
  id: "tx-1",
  type: "expense",
  amount: { toNumber: () => 5000 },
  description: "Supermercado",
  category: "food",
  date: new Date("2026-04-10"),
  notes: null,
  recurrence: "none",
  userId: "user-1",
  savingsGoalId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  tags: [{ id: "t1", tag: "comida", transactionId: "tx-1" }],
};

async function getAccessToken(): Promise<string> {
  jest.mocked(db.user.findUnique).mockResolvedValueOnce(mockUser);
  jest.mocked(db.refreshToken.create).mockResolvedValueOnce(mockToken);
  const res = await request(app).post("/api/auth/login")
    .send({ email: "tx@test.com", password: "Password1" });
  return res.body.accessToken;
}

beforeEach(async () => jest.clearAllMocks());

// ─── GET /api/transactions ────────────────────────────────────────────────────

describe("GET /api/transactions", () => {
  it("200 — devuelve lista paginada", async () => {
    const token = await getAccessToken();
    jest.mocked(db.$transaction).mockResolvedValue([2, [mockTx, mockTx]]);

    const res = await request(app)
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.data).toHaveLength(2);
  });

  it("401 — sin autenticación", async () => {
    const res = await request(app).get("/api/transactions");
    expect(res.status).toBe(401);
  });

  it("400 — parámetros de paginación inválidos", async () => {
    const token = await getAccessToken();
    const res = await request(app)
      .get("/api/transactions?page=-1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/transactions ───────────────────────────────────────────────────

describe("POST /api/transactions", () => {
  it("201 — crea transacción válida", async () => {
    const token = await getAccessToken();
    jest.mocked(db.transaction.create).mockResolvedValue(mockTx);

    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({
        type: "expense",
        amount: 5000,
        description: "Supermercado",
        category: "food",
        date: "2026-04-10",
        tags: ["comida"],
        recurrence: "none",
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe("tx-1");
    expect(res.body.amount).toBe(5000);
    expect(res.body.tags).toEqual(["comida"]);
  });

  it("400 — monto negativo", async () => {
    const token = await getAccessToken();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "expense", amount: -100, description: "X", category: "food", date: "2026-04-10" });
    expect(res.status).toBe(400);
  });

  it("400 — fecha con formato incorrecto", async () => {
    const token = await getAccessToken();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "expense", amount: 100, description: "X", category: "food", date: "10/04/2026" });
    expect(res.status).toBe(400);
  });

  it("400 — categoría inválida", async () => {
    const token = await getAccessToken();
    const res = await request(app)
      .post("/api/transactions")
      .set("Authorization", `Bearer ${token}`)
      .send({ type: "expense", amount: 100, description: "X", category: "inexistente", date: "2026-04-10" });
    expect(res.status).toBe(400);
  });
});

// ─── PATCH /api/transactions/:id ─────────────────────────────────────────────

describe("PATCH /api/transactions/:id", () => {
  it("200 — actualiza descripción", async () => {
    const token = await getAccessToken();
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);
    jest.mocked(db.$transaction).mockImplementation(async (fn: any) =>
      fn({
        transactionTag: { deleteMany: jest.fn(), createMany: jest.fn() },
        transaction: { update: async () => ({ ...mockTx, description: "Carnicería" }) },
      } as any)
    );

    const res = await request(app)
      .patch("/api/transactions/tx-1")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "Carnicería" });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe("Carnicería");
  });

  it("404 — transacción no encontrada", async () => {
    const token = await getAccessToken();
    jest.mocked(db.transaction.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .patch("/api/transactions/no-existe")
      .set("Authorization", `Bearer ${token}`)
      .send({ description: "X" });

    expect(res.status).toBe(404);
  });
});

// ─── DELETE /api/transactions/:id ────────────────────────────────────────────

describe("DELETE /api/transactions/:id", () => {
  it("204 — elimina correctamente", async () => {
    const token = await getAccessToken();
    jest.mocked(db.transaction.findFirst).mockResolvedValue(mockTx);
    jest.mocked(db.transaction.delete).mockResolvedValue(mockTx);

    const res = await request(app)
      .delete("/api/transactions/tx-1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(204);
  });

  it("404 — transacción no encontrada", async () => {
    const token = await getAccessToken();
    jest.mocked(db.transaction.findFirst).mockResolvedValue(null);

    const res = await request(app)
      .delete("/api/transactions/no-existe")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
