// src/app.ts
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes";
import { transactionsRouter } from "./routes/transactions.routes";
import { budgetsRouter} from "./routes/budgets.routes"
import { savingsGoalsRouter } from "./routes/savingGoals.routes"
import { statsRouter } from "./routes/stats.routes";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { recurringRouter } from "./routes/recurring.routes";

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
  app.use("/api/transactions",  transactionsRouter);          // auth inside router
  app.use("/api/budgets",       requireAuth, budgetsRouter);
  app.use("/api/savings-goals", requireAuth, savingsGoalsRouter);
  app.use("/api/stats",         requireAuth, statsRouter);
  app.use("/api/recurring",     requireAuth, recurringRouter);

  app.use((_req, res) => res.status(404).json({ message: "Ruta no encontrada" }));
  app.use(errorHandler);

  return app;
}
