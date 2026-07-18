import { type Response } from "express";
import { sseConnections } from "./storage.js";

/**
 * Broadcast result to a specific JOB (not user).
 * Ensures each tab receives ONLY its own job result.
 */
export const broadcastToJob = (
  jobId: string,
  data: unknown
): void => {
  const res = sseConnections.get(jobId);

  if (!res) {
    console.log(`[SSE] No active connection for job ${jobId}`);
    return;
  }

  console.log(`[SSE] Broadcasting result for job ${jobId}`);

  const message = `event: job-complete\ndata: ${JSON.stringify(data)}\n\n`;

  try {
    res.write(message);
    res.end();
    sseConnections.delete(jobId);
    console.log(`[SSE] Closed connection for job ${jobId}`);
  } catch (err) {
    const error = err as Error;
    console.error(
      `[SSE] Failed to send result for job ${jobId}:`,
      error.message
    );
    sseConnections.delete(jobId);
  }
};

/**
 * Add a new SSE connection for a JOB.
 * Only ONE connection per jobId is allowed.
 */
export const addConnection = (
  jobId: string,
  res: Response
): void => {
  console.log(`[SSE] New connection for job: ${jobId}`);

  sseConnections.set(jobId, res);

  // Initial handshake event
  res.write(
    `event: connected\ndata: ${JSON.stringify({ jobId })}\n\n`
  );
};

/**
 * Remove SSE connection when client disconnects.
 */
export const removeConnection = (
  jobId: string,
  res: Response
): void => {
  console.log(`[SSE] Connection closed for job: ${jobId}`);

  if (sseConnections.get(jobId) === res) {
    sseConnections.delete(jobId);
  }
};
