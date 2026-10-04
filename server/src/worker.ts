
import "dotenv/config";
import { createWorker } from "./services/workerService.js";

console.log("Worker process starting");

const worker = createWorker();

const shutdown = async (signal: string): Promise<void> => {
  console.log(`CLOSING${signal} received, closing worker gracefully...`);
  try {
    await worker.close();
    process.exit(0);
  } catch (err) {
    console.error("Error through shutting down worker:", err);
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

console.log("✅ Worker process ready and waiting for jobs");
