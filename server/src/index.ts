import "dotenv/config";
import express, { type Application } from "express";
import cors from "cors";

import { PORT } from "./config/constants.js";
import { startCleanupJob } from "./utils/cleanup.js";
import { redis } from "./config/queue.js";

// Routes
import executionRoutes from "./routes/executionRoutes.js";
import sseRoutes from "./routes/sseRoutes.js";
import systemRoutes from "./routes/systemRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// DB 
import { pool } from "./db/db.js";

const app: Application = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => { res.send("Welcome to etherCode execEngine"); })
app.use("/", executionRoutes);
app.use("/", sseRoutes);
app.use("/", systemRoutes);
app.use("/", problemRoutes);
app.use("/", authRoutes);

app.get("/db", async (_req, res) => {
  const result = await pool.query("SELECT 1");
  console.log(result);
  res.json({ status: "ok", db: "connected", result: result.rows });
});

// Start background cleanup job
startCleanupJob();

// Graceful shutdown
const gracefulShutdown = async (): Promise<void> => {
  console.log("\n⚠️ Shutting down gracefully...");
  try {
    await redis.quit();
    console.log("✅ Redis connection closed");
    process.exit(0);
  } catch (err) {
    const error = err as Error;
    console.error("❌ Error during shutdown:", error.message);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start server
app.listen(PORT, () => {
  console.log(`✅ API Server running on http://0.0.0.0:${PORT}`);
  console.log(`📡 SSE endpoint: /events?jobId=<jobId>`);
  console.log(`🔄 Using BullMQ + Redis for job queue`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /health           - Health check`);
  console.log(`  GET  /events           - SSE connection`);
  console.log(`  POST /run              - Submit code`);
  console.log(`  GET  /job/:jobId       - Get job status`);
  console.log(`  GET  /languages        - List languages`);
  console.log(`\n⚠️ Note: Start worker process with 'node dist/worker.js'`);
});