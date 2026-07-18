import { redis } from "./storage.js";
import {
  JOB_MAX_AGE,
  CLEANUP_INTERVAL,
} from "../config/constants.js";

// Cleanup old jobs periodically from Redis
export const startCleanupJob = (): void => {
  setInterval(async () => {
    try {
      const now = Date.now();
      const keys: string[] = await redis.keys("job:*");

      for (const key of keys) {
        const job = await redis.hgetall(key);

        const createdAt = job.createdAt
          ? Number(job.createdAt)
          : null;

        if (createdAt && now - createdAt > JOB_MAX_AGE) {
          await redis.del(key);
          console.log(`[CLEANUP] Deleted job ${key}`);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error(`[CLEANUP] Error during cleanup:`, error.message);
    }
  }, CLEANUP_INTERVAL);

  console.log(
    `✅ Cleanup job started (runs every ${CLEANUP_INTERVAL / 60000} minutes)`
  );
};
