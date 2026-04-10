// src/routes/transactions.routes.ts
import { Router } from "express";
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFiltersSchema,
} from "../schemas";
import * as svc from "../services/transactions.service";
import { validate, validateQuery } from "../middleware/validate";

export const transactionsRouter = Router();

// GET /transactions
transactionsRouter.get("/", validateQuery(transactionFiltersSchema), async (req, res, next) => {
  try {
    const result = await svc.listTransactions(req.query as any);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /transactions/:id
transactionsRouter.get("/:id", async (req, res, next) => {
  try {
    const tx = await svc.getTransactionById(req.params.id);
    if (!tx) return res.status(404).json({ message: "Transacción no encontrada" });
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

// POST /transactions
transactionsRouter.post("/", validate(createTransactionSchema), async (req, res, next) => {
  try {
    const tx = await svc.createTransaction(req.body);
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

// PATCH /transactions/:id
transactionsRouter.patch("/:id", validate(updateTransactionSchema), async (req, res, next) => {
  try {
    const tx = await svc.updateTransaction(req.params.id, req.body);
    res.json(tx);
  } catch (err) {
    next(err);
  }
});

// DELETE /transactions/:id
transactionsRouter.delete("/:id", async (req, res, next) => {
  try {
    await svc.deleteTransaction(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
