import { Router as R3 } from "express";
import { monthStatsSchema } from "../schemas";
import * as statSvc from "../services/stats.service";
import { validateQuery as vq } from "../middleware/validate";

export const statsRouter = R3();

// GET /stats/dashboard  → resumen completo del mes actual
statsRouter.get("/dashboard", async (_req, res, next) => {
    try {
        res.json(await statSvc.getFullDashboard(_req.user!.id));
    } catch (e) {
        next(e);
    }
});

// GET /stats/monthly?year=2026&month=4
statsRouter.get("/monthly", vq(monthStatsSchema), async (req, res, next) => {
    try {
        const { year, month } = req.query as any;
        const userId = req.user!.id
        res.json(await statSvc.getMonthlyStats(userId, Number(year), Number(month)));
    } catch (e) {
        next(e);
    }
});

// GET /stats/last12months
statsRouter.get("/last12months", async (_req, res, next) => {
    try {
        const userId = _req.user!.id
        res.json(await statSvc.getLast12MonthsStats(userId));
    } catch (e) {
        next(e);
    }
});
