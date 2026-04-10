// src/middleware/errorHandler.ts
import type { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(err);

  // Prisma: record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "Registro no encontrado" });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ message: "Ya existe un registro con esos datos" });
    }
    return res.status(400).json({ message: "Error de base de datos", code: err.code });
  }

  // Prisma: validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ message: "Error de validación en la consulta" });
  }

  // Generic
  const status = (err as any)?.status ?? 500;
  const message = err instanceof Error ? err.message : "Error interno del servidor";
  res.status(status).json({ message });
}
