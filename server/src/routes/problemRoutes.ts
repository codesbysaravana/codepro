import { Router } from "express";
import { getProblemsData } from "../controllers/problemController.js";

const router = Router();

// GET /api/problems - Fetch problems and code templates for the workspace
router.get("/api/problems", getProblemsData);

export default router;
