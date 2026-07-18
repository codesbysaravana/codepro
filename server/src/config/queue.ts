import { Queue } from "bullmq";
import { Redis, type RedisOptions } from "ioredis";

/* ------------------------------------------------------------------ */
/* Redis Configuration                                                 */
/* ------------------------------------------------------------------ */

export const REDIS_CONFIG: RedisOptions = {

  host: process.env.REDIS_HOST ?? "127.0.0.1", //use for local testing
  //host: process.env.REDIS_HOST ?? "172.17.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
};

/* ------------------------------------------------------------------ */
/* Redis Client                                                        */
/* ------------------------------------------------------------------ */

export const redis = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null, enableReadyCheck: false })
  : new Redis(REDIS_CONFIG);

redis.on("connect", () => {
  console.log("✅ Redis client connected successfully!");
});

redis.on("error", (err: Error) => {
  console.error("❌ Redis connection error:", err.message);
});

/* ------------------------------------------------------------------ */
/* BullMQ Queue                                                        */
/* ------------------------------------------------------------------ */

export const executionQueue = new Queue("execution-queue", {
  connection: redis,
});

/* ------------------------------------------------------------------ */
/* Job State Helpers                                                   */
/* ------------------------------------------------------------------ */

const jobKey = (id: string): string => `job:${id}`;

export const setJob = async (
  jobId: string,
  data: Record<string, string>
): Promise<void> => {
  await redis.hset(jobKey(jobId), data);
};

export const getJob = async (
  jobId: string
): Promise<Record<string, string> | null> => {
  const data = await redis.hgetall(jobKey(jobId));
  return Object.keys(data).length > 0 ? data : null;
};

export const updateJob = async (
  jobId: string,
  updates: Record<string, string>
): Promise<void> => {
  await redis.hset(jobKey(jobId), updates);
};

export const deleteJob = async (jobId: string): Promise<void> => {
  await redis.del(jobKey(jobId));
};

