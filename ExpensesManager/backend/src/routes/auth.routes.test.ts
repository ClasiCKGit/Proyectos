// src/__tests__/routes/auth.routes.test.ts
import { jest, describe, it, expect, beforeEach, afterAll } from "@jest/globals";
import request from "supertest";
import bcrypt from "bcryptjs";
import { createApp } from "../app";
import { prisma } from "../lib/prisma";

const app = createApp();
const db = prisma as jest.Mocked<typeof prisma>;

const mockUser = {
  id: "user-1",
  email: "test@email.com",
  name: "Test User",
  passwordHash: bcrypt.hashSync("Password1", 1),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockToken = {
  id: "tok-1",
  token: "stored-refresh",
  userId: "user-1",
  expiresAt: new Date(Date.now() + 86400000 * 7),
  createdAt: new Date(),
};

beforeEach(async() => jest.clearAllMocks());
afterAll(async() => jest.clearAllMocks());

// ─── POST /api/auth/register ──────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("201 — crea cuenta y devuelve tokens", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(null);
    jest.mocked(db.user.create).mockResolvedValue(mockUser);
    jest.mocked(db.refreshToken.create).mockResolvedValue(mockToken);

    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "test@email.com",
      password: "Password1",
    });

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.email).toBe("test@email.com");
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("400 — contraseña sin mayúscula", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test", email: "a@b.com", password: "alllower1",
    });
    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it("400 — email inválido", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test", email: "not-an-email", password: "Password1",
    });
    expect(res.status).toBe(400);
  });

  it("409 — email duplicado", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/register").send({
      name: "Test", email: "test@email.com", password: "Password1",
    });
    expect(res.status).toBe(409);
  });
});

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  it("200 — credenciales correctas", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
    jest.mocked(db.refreshToken.create).mockResolvedValue(mockToken);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@email.com",
      password: "Password1",
    });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
  });

  it("401 — contraseña incorrecta", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

    const res = await request(app).post("/api/auth/login").send({
      email: "test@email.com",
      password: "WrongPass1",
    });
    expect(res.status).toBe(401);
  });

  it("401 — usuario inexistente", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(null);

    const res = await request(app).post("/api/auth/login").send({
      email: "noexiste@email.com",
      password: "Password1",
    });
    expect(res.status).toBe(401);
  });

  it("400 — body vacío", async () => {
    const res = await request(app).post("/api/auth/login").send({});
    expect(res.status).toBe(400);
  });
});

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

describe("GET /api/auth/me", () => {
  it("200 — devuelve el perfil con token válido", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
    jest.mocked(db.refreshToken.create).mockResolvedValue(mockToken);

    const loginRes = await request(app).post("/api/auth/login").send({
      email: "test@email.com", password: "Password1",
    });
    const { accessToken } = loginRes.body;

    jest.mocked(db.user.findUniqueOrThrow).mockResolvedValue(mockUser);

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe("test@email.com");
  });

  it("401 — sin token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("401 — token inválido", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
