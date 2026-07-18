import { type Request, type Response } from "express";

import { addConnection, removeConnection } from "../utils/sse.js";
import { redis } from "../utils/storage.js";
import { JOB_STATUS } from "../config/constants.js";

/**
 * SSE endpoint – one connection per jobId
 * Frontend connects here for real-time job updates
 */
export const handleSSE = (req: Request, res: Response): void => {
  const jobId = typeof req.query.jobId === "string" ? req.query.jobId : "unknown";

  if (!jobId || jobId === "unknown") {
    console.error("[SSE] Missing jobId parameter");
    res.status(400).json({ error: "jobId query parameter is required" });
    return;
  }

  console.log(`[SSE] Handling SSE connection for job: ${jobId}`);

  // SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Register this SSE connection
  addConnection(jobId, res);

  // Poll Redis for job completion
  const pollInterval = setInterval(async () => {
    try {
      const jobKey = `job:${jobId}`;
      const job = await redis.hgetall(jobKey);

      if (
        job &&
        job.status === JOB_STATUS.COMPLETED &&
        job.delivered !== "true"
      ) {
        console.log(`[SSE] Job ${jobId} completed, sending result`);

        const result = job.result ? JSON.parse(job.result) : null;
        const mode = job.mode ?? "run";

        const payload = {
          jobId,
          result,
          mode,
        };

        const message = `event: job-complete\ndata: ${JSON.stringify(
          payload
        )}\n\n`;

        res.write(message);

        // Mark as delivered
        await redis.hset(jobKey, { delivered: "true" });

        // Close connection after sending result
        res.end();
        clearInterval(pollInterval);
        removeConnection(jobId, res);
      }
    } catch (err) {
      const error = err as Error;
      console.error(
        `[SSE] Error polling for job ${jobId}:`,
        error.message
      );
    }
  }, 500);

  // Cleanup on client disconnect (tab close / refresh)
  req.on("close", () => {
    clearInterval(pollInterval);
    removeConnection(jobId, res);
  });
};
