// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { transactionsRouter } from "./routes/transactions.routes";
import { budgetsRouter, savingsGoalsRouter, statsRouter } from "./routes/other.routes";
import { errorHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // ─── GLOBAL MIDDLEWARE ──────────────────────────────────────────────────────
  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? "http://localhost:5173" }));
  app.use(express.json());

  // ─── HEALTH CHECK ───────────────────────────────────────────────────────────
  app.get("/health", (_req, res) => res.json({ status: "ok" }));

  // ─── ROUTES ─────────────────────────────────────────────────────────────────
  app.use("/api/transactions", transactionsRouter);
  app.use("/api/budgets", budgetsRouter);
  app.use("/api/savings-goals", savingsGoalsRouter);
  app.use("/api/stats", statsRouter);

  // ─── 404 ────────────────────────────────────────────────────────────────────
  app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));

  // ─── ERROR HANDLER ──────────────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
