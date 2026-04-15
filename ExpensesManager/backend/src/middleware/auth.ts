import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name: string;
      };
    }
  }
}

/*
 * Validates the Bearer token in the Authorization header.
 * On success, attaches `req.user` and calls next().
 * On failure, returns 401.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token de acceso requerido" });
  }

  const token = header.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err: any) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Token inválido" });
  }
}
