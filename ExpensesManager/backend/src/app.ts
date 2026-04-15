// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes";
import { transactionsRouter } from "./routes/transactions.routes";
import { budgetsRouter, savingsGoalsRouter, statsRouter } from "./routes/other.routes";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  // ─── HEALTH ───────────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // ─── PUBLIC ───────────────────────────────────────────────────────────────
  app.use("/api/auth", authRouter);

  // ─── PROTECTED ────────────────────────────────────────────────────────────
  // requireAuth applied per-router (transactions) or globally here for the rest
  app.use("/api/transactions", transactionsRouter);          // auth inside router
  app.use("/api/budgets",       requireAuth, budgetsRouter);
  app.use("/api/savings-goals", requireAuth, savingsGoalsRouter);
  app.use("/api/stats",         requireAuth, statsRouter);

  app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
  app.use(errorHandler);

  return app;
}
