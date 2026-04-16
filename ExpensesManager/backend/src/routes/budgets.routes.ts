import { Router } from "express";
import { upsertBudgetSchema } from "../schemas";
import * as svc from "../services/budgets.service";
import { validate } from "../middleware/validate";

export const budgetsRouter = Router();

budgetsRouter.get("/", async (req, res, next) => {
    try {
        res.json(await svc.listBudgets(req.user!.id));
    } catch (e) {
        next(e);
    }
});

budgetsRouter.put("/", validate(upsertBudgetSchema), async (req, res, next) => {
    try {
        res.json(await svc.upsertBudget({ ...req.body, userId: req.user!.id }));
    } catch (e) {
        next(e);
    }
});

budgetsRouter.delete("/:id", async (req, res, next) => {
    try {
        await svc.deleteBudget(req.params.id, req.user!.id);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});
