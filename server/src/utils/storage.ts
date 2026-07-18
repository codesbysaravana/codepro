// Redis-based Storage (Production-ready with BullMQ)
// SSE connections still use in-memory Map since they are ephemeral

import type { Response } from "express";
import {
  redis,
  setJob,
  getJob,
  deleteJob,
} from "../config/queue.js";
import type { TestCase } from "../types/testCases.js";

/* ------------------------------------------------------------------ */
/* SSE Connection Management                                          */
/* ------------------------------------------------------------------ */
/**
 * ONE SSE connection per jobId
 * Stored in-memory because SSE connections are ephemeral
 */
export const sseConnections = new Map<string, Response>();

/* ------------------------------------------------------------------ */
/* Job Types                                                          */
/* ------------------------------------------------------------------ */

export interface JobRecord {                                                                          
  status: string;                                                               
  token?: string | null;                                                                          
  result?: unknown;                                                                     
  error?: string | null;
  createdAt?: number;
  userId?: string;
  testCases?: TestCase[];
  sampleTestCases?: TestCase[];
  hiddenTestCases?: TestCase[];
  mode?: string;
}

type FlatJobData = Record<string, string>;
type RawJobData = Record<string, string>;

/* ------------------------------------------------------------------ */
/* Job Store (Redis-backed)                                           */
/* ------------------------------------------------------------------ */

export const jobStore = {
  /**
   * Get job from Redis and PARSE fields back into objects
   */
  get: async (jobId: string): Promise<JobRecord | null> => {
    const raw: RawJobData | null = await getJob(jobId);
    if (!raw) return null;

    return {
      status: raw.status ?? "unknown",
      token: raw.token ?? null,
      error: raw.error ?? null,
      userId: raw.userId,
      mode: raw.mode,
      createdAt: raw.createdAt ? Number(raw.createdAt) : undefined,

      result: raw.result ? JSON.parse(raw.result) : undefined,
      testCases: raw.testCases ? JSON.parse(raw.testCases) : undefined,
      sampleTestCases: raw.sampleTestCases
        ? JSON.parse(raw.sampleTestCases)
        : undefined,
      hiddenTestCases: raw.hiddenTestCases
        ? JSON.parse(raw.hiddenTestCases)
        : undefined,
    };
  },

  /**
   * Store job into Redis (FLATTEN everything to strings)
   */
  set: async (jobId: string, data: Partial<JobRecord>): Promise<void> => {
    const flat: FlatJobData = {};

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) continue;

      flat[key] =
        typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    }

    await setJob(jobId, flat);
  },

  has: async (jobId: string): Promise<boolean> => {
    const job = await getJob(jobId);
    return job !== null;
  },

  delete: async (jobId: string): Promise<void> => {
    await deleteJob(jobId);
  },
};

/* ------------------------------------------------------------------ */
/* Token → JobId Mapping (Redis-backed)                               */
/* ------------------------------------------------------------------ */

export const tokenToJobId = {
  set: async (token: string, jobId: string): Promise<void> => {
    // 1 hour expiry
    await redis.set(`token:${token}`, jobId, "EX", 3600);
  },

  get: async (token: string): Promise<string | null> => {
    return await redis.get(`token:${token}`);
  },

  delete: async (token: string): Promise<void> => {
    await redis.del(`token:${token}`);
  },
};

/* ------------------------------------------------------------------ */
/* Re-export redis for convenience                                   */
/* ------------------------------------------------------------------ */

export { redis };
