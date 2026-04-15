// src/routes/auth.routes.ts
import { Router } from "express";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
} from "../schemas/auth.schemas";
import * as svc from "../services/auth.service";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/auth";

export const authRouter = Router();

// POST /auth/register
authRouter.post("/register", validate(registerSchema), async (req, res, next) => {
  try {
    const result = await svc.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/login
authRouter.post("/login", validate(loginSchema), async (req, res, next) => {
  try {
    const result = await svc.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/refresh
authRouter.post("/refresh", validate(refreshSchema), async (req, res, next) => {
  try {
    const result = await svc.refresh(req.body.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout  (requires valid access token)
authRouter.post("/logout", requireAuth, validate(refreshSchema), async (req, res, next) => {
  try {
    await svc.logout(req.body.refreshToken);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// POST /auth/logout-all  (revoke all sessions)
authRouter.post("/logout-all", requireAuth, async (req, res, next) => {
  try {
    await svc.logoutAll(req.user!.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// GET /auth/me
authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await svc.getProfile(req.user!.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});
