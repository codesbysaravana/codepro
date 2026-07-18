import { Router } from "express";
import { handleSSE } from "../controllers/sseController.js";

const router = Router();

// GET /events - SSE endpoint for real-time updates
router.get("/events", handleSSE);

export default router;
