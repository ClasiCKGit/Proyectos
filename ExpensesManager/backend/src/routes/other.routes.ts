// src/routes/budgets.routes.ts
import { Router } from "express";
import { upsertBudgetSchema } from "../schemas";
import * as svc from "../services/budgets.service";
import { validate } from "../middleware/validate";

export const budgetsRouter = Router();

budgetsRouter.get("/", async (_req, res, next) => {
  try { res.json(await svc.listBudgets()); } catch (e) { next(e); }
});

budgetsRouter.put("/", validate(upsertBudgetSchema), async (req, res, next) => {
  try { res.json(await svc.upsertBudget(req.body)); } catch (e) { next(e); }
});

budgetsRouter.delete("/:id", async (req, res, next) => {
  try { await svc.deleteBudget(req.params.id); res.status(204).send(); } catch (e) { next(e); }
});


// src/routes/savingsGoals.routes.ts
import { Router as R2 } from "express";
import {
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
  contributeGoalSchema,
} from "../schemas";
import * as goalSvc from "../services/savingsGoals.service";
import { validate as v } from "../middleware/validate";

export const savingsGoalsRouter = R2();

savingsGoalsRouter.get("/", async (_req, res, next) => {
  try { res.json(await goalSvc.listSavingsGoals()); } catch (e) { next(e); }
});

savingsGoalsRouter.post("/", v(createSavingsGoalSchema), async (req, res, next) => {
  try { res.status(201).json(await goalSvc.createSavingsGoal(req.body)); } catch (e) { next(e); }
});

savingsGoalsRouter.patch("/:id", v(updateSavingsGoalSchema), async (req, res, next) => {
  try { res.json(await goalSvc.updateSavingsGoal(req.params.id, req.body)); } catch (e) { next(e); }
});

savingsGoalsRouter.post("/:id/contribute", v(contributeGoalSchema), async (req, res, next) => {
  try { res.json(await goalSvc.contributeToGoal(req.params.id, req.body.amount)); } catch (e) { next(e); }
});

savingsGoalsRouter.delete("/:id", async (req, res, next) => {
  try { await goalSvc.deleteSavingsGoal(req.params.id); res.status(204).send(); } catch (e) { next(e); }
});


// src/routes/stats.routes.ts
import { Router as R3 } from "express";
import { monthStatsSchema } from "../schemas";
import * as statSvc from "../services/stats.service";
import { validateQuery as vq } from "../middleware/validate";

export const statsRouter = R3();

// GET /stats/dashboard  → resumen completo del mes actual
statsRouter.get("/dashboard", async (_req, res, next) => {
  try { res.json(await statSvc.getFullDashboard()); } catch (e) { next(e); }
});

// GET /stats/monthly?year=2026&month=4
statsRouter.get("/monthly", vq(monthStatsSchema), async (req, res, next) => {
  try {
    const { year, month } = req.query as any;
    res.json(await statSvc.getMonthlyStats(Number(year), Number(month)));
  } catch (e) { next(e); }
});

// GET /stats/last12months
statsRouter.get("/last12months", async (_req, res, next) => {
  try { res.json(await statSvc.getLast12MonthsStats()); } catch (e) { next(e); }
});
