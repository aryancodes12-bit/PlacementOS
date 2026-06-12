import { Router } from "express";
import { dbHealthCheck, healthCheck } from "../controllers/health.controller";

const router = Router();

router.get("/health", healthCheck);
router.get("/db-health", dbHealthCheck);

export default router;