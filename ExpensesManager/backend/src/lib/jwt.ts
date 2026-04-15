// src/lib/jwt.ts
import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES ?? "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES ?? "7d";

export interface AccessTokenPayload {
  sub: string;   // userId
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  sub: string;   // userId
  jti: string;   // token ID (matches RefreshToken.id in DB)
}

// ─── SIGN ─────────────────────────────────────────────────────────────────────

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions);
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions);
}

// ─── VERIFY ───────────────────────────────────────────────────────────────────

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as RefreshTokenPayload;
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/** Returns the Date when a refresh token expires (matches JWT_REFRESH_EXPIRES) */
export function refreshTokenExpiresAt(): Date {
  const ms = parseDuration(REFRESH_EXPIRES);
  return new Date(Date.now() + ms);
}

function parseDuration(str: string): number {
  const units: Record<string, number> = {
    s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000,
  };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) throw new Error(`Invalid duration: ${str}`);
  return Number(match[1]) * units[match[2]];
}
