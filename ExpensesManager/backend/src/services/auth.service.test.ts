// src/__tests__/services/auth.service.test.ts
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import bcrypt from "bcryptjs";
import * as authService from "../services/auth.service";
import { prisma } from "../lib/prisma";

const db = prisma as jest.Mocked<typeof prisma>;

// ─── FIXTURES ────────────────────────────────────────────────────────────────

const mockUser = {
  id: "user-1",
  email: "test@email.com",
  name: "Test User",
  passwordHash: bcrypt.hashSync("Password1", 1),
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockRefreshToken = {
  id: "token-id-1",
  token: "refresh.token.value",
  userId: "user-1",
  expiresAt: new Date(Date.now() + 86400000 * 7),
  createdAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Default: refreshToken.create always succeeds
  jest.mocked(db.refreshToken.create).mockResolvedValue(mockRefreshToken);
});

// ─── REGISTER ─────────────────────────────────────────────────────────────────

describe("auth.service — register", () => {
  it("crea un usuario nuevo y devuelve tokens", async () => {
    (db.user.findUnique).mockResolvedValue(null);
    (db.user.create).mockResolvedValue(mockUser);

    const result = await authService.register({
      name: "Test User",
      email: "test@email.com",
      password: "Password1",
    });

    expect(result.user.email).toBe("test@email.com");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user).not.toHaveProperty("passwordHash");
  });

  it("lanza 409 si el email ya existe", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

    await expect(
      authService.register({ name: "X", email: "test@email.com", password: "Password1" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("hashea la contraseña antes de guardar", async () => {
    (db.user.findUnique).mockResolvedValue(null);
    (db.user.create).mockResolvedValue(mockUser);

    await authService.register({ name: "X", email: "x@x.com", password: "Password1" });

    const createCall = (db.user.create as jest.Mock).mock.calls[0][0] as any;
    expect(createCall.data.passwordHash).not.toBe("Password1");
    expect(createCall.data.passwordHash).toMatch(/^\$2[ab]\$/);
  });
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────

describe("auth.service — login", () => {
  it("devuelve usuario y tokens con credenciales correctas", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

    const result = await authService.login({
      email: "test@email.com",
      password: "Password1",
    });

    expect(result.user.id).toBe("user-1");
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
  });

  it("lanza 401 con contraseña incorrecta", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);

    await expect(
      authService.login({ email: "test@email.com", password: "WrongPass1" })
    ).rejects.toMatchObject({ status: 401 });
  });

  it("lanza 401 si el usuario no existe (timing-safe)", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(null);

    await expect(
      authService.login({ email: "noexiste@email.com", password: "Password1" })
    ).rejects.toMatchObject({ status: 401 });
  });
});

// ─── REFRESH ──────────────────────────────────────────────────────────────────

describe("auth.service — refresh", () => {
  it("rota el refresh token y devuelve nuevos tokens", async () => {
    // First login to get a real refresh token
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
    const { refreshToken } = await authService.login({ email: "test@email.com", password: "Password1" });

    // Mock stored token lookup
    jest.mocked(db.refreshToken.findUnique).mockResolvedValue({
      ...mockRefreshToken,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 86400000),
    });
    jest.mocked(db.refreshToken.delete).mockResolvedValue(mockRefreshToken);
    jest.mocked(db.user.findUniqueOrThrow).mockResolvedValue(mockUser);

    const result = await authService.refresh(refreshToken);

    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(db.refreshToken.delete).toHaveBeenCalledTimes(1);
  });

  it("lanza 401 con token inválido", async () => {
    await expect(authService.refresh("invalid.token")).rejects.toMatchObject({ status: 401 });
  });

  it("revoca todos los tokens si detecta reuso", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
    const { refreshToken } = await authService.login({ email: "test@email.com", password: "Password1" });

    // Simulate: token not found in DB (already used → reuse detected)
    jest.mocked(db.refreshToken.findUnique).mockResolvedValue(null);
    jest.mocked(db.refreshToken.deleteMany).mockResolvedValue({ count: 1 });

    await expect(authService.refresh(refreshToken)).rejects.toMatchObject({ status: 401 });
    expect(db.refreshToken.deleteMany).toHaveBeenCalledTimes(1);
  });
});

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

describe("auth.service — logout", () => {
  it("elimina el refresh token de la base de datos", async () => {
    jest.mocked(db.user.findUnique).mockResolvedValue(mockUser);
    const { refreshToken } = await authService.login({ email: "test@email.com", password: "Password1" });

    jest.mocked(db.refreshToken.deleteMany).mockResolvedValue({ count: 1 });

    await authService.logout(refreshToken);

    expect(db.refreshToken.deleteMany).toHaveBeenCalledTimes(1);
  });

  it("no lanza error con token inválido (idempotente)", async () => {
    await expect(authService.logout("bad.token")).resolves.toBeUndefined();
  });
});
