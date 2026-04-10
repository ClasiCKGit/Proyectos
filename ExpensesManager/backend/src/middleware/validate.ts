// src/middleware/validate.ts
import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

/** Validates req.body against a Zod schema */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        message: "Datos inválidos",
        errors: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.body = result.data; // replace with coerced values
    next();
  };
}

/** Validates req.query against a Zod schema */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        message: "Parámetros de consulta inválidos",
        errors: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.query = result.data as any;
    next();
  };
}
