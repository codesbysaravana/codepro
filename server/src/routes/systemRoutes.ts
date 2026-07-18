import { Router } from "express";
import {
  listLanguages,
  healthCheck,
} from "../controllers/systemController.js";

const router = Router();

// GET /health - Health check
router.get("/health", healthCheck);

// GET /languages - List available languages
router.get("/languages", listLanguages);

export default router;
