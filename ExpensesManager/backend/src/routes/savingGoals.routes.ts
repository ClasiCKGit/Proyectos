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
    try {
        res.json(await goalSvc.listSavingsGoals(_req.user!.id));
    } catch (e) {
        next(e);
    }
});

savingsGoalsRouter.post(
    "/",
    v(createSavingsGoalSchema),
    async (req, res, next) => {
        try {
            res.status(201).json(await goalSvc.createSavingsGoal(req.body));
        } catch (e) {
            next(e);
        }
    },
);

savingsGoalsRouter.patch(
    "/:id",
    v(updateSavingsGoalSchema),
    async (req, res, next) => {
        try {
            res.json(await goalSvc.updateSavingsGoal(req.params.id, req.body));
        } catch (e) {
            next(e);
        }
    },
);

savingsGoalsRouter.post(
    "/:id/contribute",
    v(contributeGoalSchema),
    async (req, res, next) => {
        try {
            res.json(
                await goalSvc.contributeToGoal(req.params.id, req.body.amount),
            );
        } catch (e) {
            next(e);
        }
    },
);

savingsGoalsRouter.delete("/:id", async (req, res, next) => {
    try {
        await goalSvc.deleteSavingsGoal(req.params.id);
        res.status(204).send();
    } catch (e) {
        next(e);
    }
});
