// src/services/auth.service.ts
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "../lib/prisma";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  refreshTokenExpiresAt,
} from "../lib/jwt";
import type { RegisterInput, LoginInput } from "../schemas/auth.schemas";
import { processRecurringForUser } from "./recurring.service";

const SALT_ROUNDS = 12;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function publicUser(user: { id: string; email: string; name: string; createdAt: Date }) {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

async function issueTokenPair(userId: string, email: string, name: string) {
  const jti = uuidv4();
  const expiresAt = refreshTokenExpiresAt();

  const accessToken = signAccessToken({ sub: userId, email, name });
  const refreshToken = signRefreshToken({ sub: userId, jti });

  await prisma.refreshToken.create({
    data: { id: jti, token: refreshToken, userId, expiresAt },
  });

  return { accessToken, refreshToken };
}

// ─── REGISTER ─────────────────────────────────────────────────────────────────

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    const err = new Error("Ya existe una cuenta con ese email") as any;
    err.status = 409;
    throw err;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  const tokens = await issueTokenPair(user.id, user.email, user.name);

  return { user: publicUser(user), ...tokens };
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────


export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  const hash = user?.passwordHash ?? "$2a$12$invalidhashtopreventtimingattack";
  const valid = await bcrypt.compare(input.password, hash);

  if (!user || !valid) {
    const err = new Error("Email o contraseña incorrectos") as any;
    err.status = 401;
    throw err;
  }

  const tokens = await issueTokenPair(user.id, user.email, user.name);

  // ── Procesar recurrencias en background ───────────────────────────────────
  // No esperamos el resultado para no bloquear el login.
  // El cliente recibirá las transacciones generadas en la próxima llamada a /stats.
  processRecurringForUser(user.id)
    .then((result) => {
      if (result.generated.length > 0) {
        console.log(
          `[auth] Login ${user.email}: ${result.generated.length} recurrencias procesadas`
        );
      }
    })
    .catch((err) => {
      // No debe romper el login bajo ninguna circunstancia
      console.error("[auth] Error procesando recurrencias en login:", err);
    });

  return { user: publicUser(user), ...tokens };
}


// ─── REFRESH ──────────────────────────────────────────────────────────────────

export async function refresh(rawRefreshToken: string) {
  let payload;
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    const err = new Error("Refresh token inválido o expirado") as any;
    err.status = 401;
    throw err;
  }

  // Check token exists in DB and hasn't been revoked
  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.jti } });

  if (!stored || stored.token !== rawRefreshToken || stored.expiresAt < new Date()) {
    // Possible token reuse — revoke all tokens for this user (security measure)
    await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
    const err = new Error("Refresh token revocado. Iniciá sesión nuevamente") as any;
    err.status = 401;
    throw err;
  }

  // Rotate: delete old token, issue new pair
  await prisma.refreshToken.delete({ where: { id: payload.jti } });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: payload.sub } });
  const tokens = await issueTokenPair(user.id, user.email, user.name);

  return { user: publicUser(user), ...tokens };
}

// ─── LOGOUT ───────────────────────────────────────────────────────────────────

/** Revoke a single refresh token */
export async function logout(rawRefreshToken: string) {
  try {
    const payload = verifyRefreshToken(rawRefreshToken);
    await prisma.refreshToken.deleteMany({ where: { id: payload.jti } });
  } catch {
    // Token already invalid — no-op, logout is idempotent
  }
}

/** Revoke ALL refresh tokens for a user (logout from all devices) */
export async function logoutAll(userId: string) {
  await prisma.refreshToken.deleteMany({ where: { userId } });
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export async function getProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  return publicUser(user);
}
