// src/routes/recurring.routes.ts
import { Router } from "express";
import { createRecurringSchema, updateRecurringSchema } from "../schemas/recurring.schemas";
import * as svc from "../services/recurring.service";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

export const recurringRouter = Router();

recurringRouter.use(requireAuth);

// GET /api/recurring
recurringRouter.get("/", async (req, res, next) => {
  try {
    res.json(await svc.listRecurring(req.user!.id));
  } catch (err) { next(err); }
});

// GET /api/recurring/upcoming?days=30
recurringRouter.get("/upcoming", async (req, res, next) => {
  try {
    const days = Math.min(Number(req.query.days ?? 30), 365);
    res.json(await svc.getUpcomingOccurrences(req.user!.id, days));
  } catch (err) { next(err); }
});

// GET /api/recurring/monthlystats
recurringRouter.get("/monthlystats", async (req, res, next) => {
  try {
    const monthlys = await svc.getMonthlyStats(req.user!.id);
    if (!monthlys) return res.status(404).json({ message: "Error encontrando las estadisticas"});
    res.json(monthlys)
  } catch (err) { next(err); }
})

// GET /api/recurring/:id
recurringRouter.get("/:id", async (req, res, next) => {
  try {
    const row = await svc.getRecurringById(req.user!.id, req.params.id);
    if (!row) return res.status(404).json({ message: "Recurrencia no encontrada" });
    res.json(row);
  } catch (err) { next(err); }
});

// POST /api/recurring
recurringRouter.post("/", validate(createRecurringSchema), async (req, res, next) => {
  try {
    res.status(201).json(await svc.createRecurring(req.user!.id, req.body));
  } catch (err) { next(err); }
});

// PATCH /api/recurring/:id
recurringRouter.patch("/:id", validate(updateRecurringSchema), async (req, res, next) => {
  try {
    const row = await svc.updateRecurring(req.user!.id, req.params.id, req.body);
    if (!row) return res.status(404).json({ message: "Recurrencia no encontrada" });
    res.json(row);
  } catch (err) { next(err); }
});

// PATCH /api/recurring/:id/toggle  — activa / pausa
recurringRouter.patch("/:id/toggle", async (req, res, next) => {
  try {
    const row = await svc.toggleRecurring(req.user!.id, req.params.id);
    if (!row) return res.status(404).json({ message: "Recurrencia no encontrada" });
    res.json(row);
  } catch (err) { next(err); }
});

// DELETE /api/recurring/:id
recurringRouter.delete("/:id", async (req, res, next) => {
  try {
    const deleted = await svc.deleteRecurring(req.user!.id, req.params.id);
    if (!deleted) return res.status(404).json({ message: "Recurrencia no encontrada" });
    res.status(204).send();
  } catch (err) { next(err); }
});

// POST /api/recurring/process  — forzar procesamiento manual (útil para testing)
recurringRouter.post("/process", async (req, res, next) => {
  try {
    const result = await svc.processRecurringForUser(req.user!.id);
    res.json(result);
  } catch (err) { next(err); }
});
