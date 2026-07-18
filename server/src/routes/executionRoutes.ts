import { Router } from "express";
import {
  runCode,
  getJobStatus,
} from "../controllers/executionController.js";

const router = Router();

// POST /run - Submit code for execution
router.post("/run", runCode);

// GET /job/:jobId - Get job status and result
router.get("/job/:jobId", getJobStatus);

export default router;
