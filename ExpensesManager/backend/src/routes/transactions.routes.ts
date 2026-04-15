// src/routes/transactions.routes.ts  (versión con auth)
import { Router } from "express";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
} from "../schemas";
import * as svc from "../services/transactions.service";
import { validate, validateQuery } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

export const transactionsRouter = Router();

// All transaction routes require authentication
transactionsRouter.use(requireAuth);

transactionsRouter.get(
  "/",
  validateQuery(transactionFiltersSchema),
  async (req, res, next) => {
    try {
      res.json(await svc.listTransactions(req.user!.id, req.query as any));
    } catch (err) {
      next(err);
    }
  },
);

transactionsRouter.get("/:id", async (req, res, next) => {
  try {
    const tx = await svc.getTransactionById(req.user!.id, req.params.id);
    if (!tx)
      return res.status(404).json({ message: "Transacción no encontrada" });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

transactionsRouter.post(
  "/",
  validate(createTransactionSchema),
  async (req, res, next) => {
    try {
      res.status(201).json(await svc.createTransaction(req.user!.id, req.body));
    } catch (err) {
      next(err);
    }
  },
);

transactionsRouter.patch(
  "/:id",
  validate(updateTransactionSchema),
  async (req, res, next) => {
    try {
      const tx = await svc.updateTransaction(
        req.user!.id,
        req.params.id,
        req.body,
      );
      if (!tx)
        return res.status(404).json({ message: "Transacción no encontrada" });
      res.json(tx);
    } catch (err) {
      next(err);
    }
  },
);

transactionsRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await svc.deleteTransaction(req.user!.id, req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Transacción no encontrada" });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
