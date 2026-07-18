/******************************************************************
 * WORKER.TS – BullMQ Worker Process
 * Processes code execution jobs from the queue
 ******************************************************************/

import { createWorker } from "./services/workerService.js";

console.log("🔥 Worker process starting...");

// Create and start the worker
const worker = createWorker();

// Graceful shutdown handler
const shutdown = async (signal: string): Promise<void> => {
  console.log(`⚠️ ${signal} received, closing worker gracefully...`);
  try {
    await worker.close();
    process.exit(0);
  } catch (err) {
    console.error("❌ Error while shutting down worker:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("✅ Worker process ready and waiting for jobs");
